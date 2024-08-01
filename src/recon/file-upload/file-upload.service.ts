import { Multer } from 'multer';
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import * as fastcsv from 'fast-csv';

import { performance, PerformanceObserver } from 'perf_hooks';
import type { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { FileValidationService } from './file-validation.service';
import { DBService } from './db.service';


export interface IFileUpload {
    fileName: string;
    fileSize: number;
    fileType: string;
    count: number;
    uploadBy: string;
    isDuplicate?: boolean;
}
@Injectable()
export class FileUploadService {


    private readonly uploadPath = path.join(__dirname, '..', 'uploads');

    private missingTXNS: any[] = [];
    private duplicateTXNS: any[] = [];
    private invalidTXNS: any[] = [];
    private validTXNS: any[] = [];
    private fileUploads: IFileUpload[] = [];
    constructor(
        private dbSvc: DBService,
        @InjectClickHouse() private readonly clickdb: ClickHouseClient, private validator: FileValidationService
    ) { }

    async checkDuplicateUploads(files: Multer.File[], isSwitch: boolean): Promise<IFileUpload[]> {

        const uploadedFiles = await this.getUploadedFileHistory();

        let response: IFileUpload[] = [];
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath);
        }
        const fileProcessingPromises = files.map((file, idx) => {
            return new Promise((resolve, reject) => {
                console.log('filename=>', file.originalname);

                if (uploadedFiles.some(uploadedFile => uploadedFile.fileName === file.originalname)) {
                    response.push({ fileName: file.originalname, isDuplicate: true, count: 0, uploadBy: '', fileSize: file.size, fileType: isSwitch ? 'SWITCH' : 'NPCI' });
                    console.log(`duplicate file: ${file.originalname}`);
                    return resolve(response);
                } else {
                    console.log(`this should not work in case of same file name: ${file.originalname}`);
                    let recordCount = 0;
                    response.push({ fileName: file.originalname, count: 0, uploadBy: '', fileSize: file.size, fileType: isSwitch ? 'SWITCH' : 'NPCI', isDuplicate: false });
                    const filePath = path.join(this.uploadPath, file.originalname);
                    fs.writeFileSync(filePath, file.buffer);
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', () => recordCount++)
                        .on('end', () => {
                            response[idx].count = recordCount;
                            fs.unlinkSync(filePath);
                            resolve(response);
                        })
                        .on('error', (err) => {
                            console.error(err);
                            reject(err);
                        });
                }
            });
        });
        await Promise.all(fileProcessingPromises);
        return response;
    }

    async validateAndStoreFiles(files: Multer.File[], isSwitchFile: boolean) {
        try {
            const startTime = performance.now();
            if (!fs.existsSync(this.uploadPath)) {
                fs.mkdirSync(this.uploadPath);
            }
            console.log('isSwitchFile: ', isSwitchFile);

            //check for duplicate file entry in database
            const response = await this.checkDuplicateUploads(files, isSwitchFile);
            console.log(response);
            // Extract filenames of non-duplicate files
            const nonDuplicateFiles = files.filter(file =>
                !response.some(res => res.fileName === file.originalname && res.isDuplicate)
            );

            //proceed to upload non-duplicate files
            const transactionIds = new Set<string>();
            const fileProcessingPromises = nonDuplicateFiles.map(file => this.processFile(file, isSwitchFile, transactionIds));
            await Promise.all(fileProcessingPromises);
            isSwitchFile ? await this.dbSvc.insertSwitchDataToDB(this.validTXNS) : await this.dbSvc.insertNPCIDataToDB(this.validTXNS);
            await this.dbSvc.insertJunkDataToDB(this.invalidTXNS, isSwitchFile, 'INVALID_TXN');
            await this.dbSvc.insertJunkDataToDB(this.duplicateTXNS, isSwitchFile, 'DUPLICATE_TXN');
            await this.dbSvc.insertJunkDataToDB(this.missingTXNS, isSwitchFile, 'MISSING_TXN');
            await this.dbSvc.insertFileHistory(response);
            console.log(`File processing took ${performance.now() - startTime} milliseconds`);
            return { status: true, duplicateFiles: response, msg: `File processing took ${(performance.now() - startTime) / 60000} minutes` };

        } catch (error) {
            console.error(error);
            throw new BadRequestException(`Error in file processing`, error);
        } finally {
            fs.rmSync(this.uploadPath, { recursive: true, force: true });
            this.invalidTXNS = [];
            this.validTXNS = [];
            this.duplicateTXNS = [];
            this.missingTXNS = [];
            console.log('File processing completed');
        }
    }

    private processFile(file: Multer.File, isSwitchFile: boolean, transactionIds: Set<string>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const filePath = path.join(this.uploadPath, file.originalname);
            fs.writeFileSync(filePath, file.buffer);
            const headers = isSwitchFile ? [
                'TXN_DATE', 'AMOUNT', 'UPICODE', 'STATUS', 'RRN', 'EXT_TXN_ID', 'PAYEE_VPA', 'NOTE', 'PAYER_VPA', '\\N', 'UPI_TXN_ID', 'MCC'
            ] : [
                'NA', 'TX_TYPE', 'UPI_TXN_ID', 'RRN', 'UPICODE', 'TXN_DATE', 'TXN_TIME', 'AMOUNT', 'UMN', 'MAPPER_ID', 'INIT_MODE', 'PURPOSE_CODE', 'PAYER_CODE', 'PAYER_MCC', 'PAYER_VPA', 'PAYEE_CODE', 'MCC', 'PAYEE_VPA', 'REM_CODE', 'REM_IFSC_CODE', 'REM_ACC_TYPE', 'REM_ACC_NUMBER', 'BEN_CODE', 'BEN_IFSC_CODE', 'BEN_ACC_TYPE', 'BEN_ACC_NUMBER'
            ];
            fs.createReadStream(filePath)
                .pipe(csv({ headers }))
                .on('data', (data) => {

                    const mappedData = this.validator.mapData(data, isSwitchFile);
                    if (this.validator.hasMissingFields(mappedData, isSwitchFile)) {
                        this.missingTXNS.push(mappedData);
                    } else if (transactionIds.has(mappedData['UPI_TXN_ID'])) {
                        this.duplicateTXNS.push(mappedData);
                    } else if (this.validator.validateRow(mappedData)) {
                        this.invalidTXNS.push(mappedData);
                    } else {
                        this.validTXNS.push(mappedData);
                        transactionIds.add(mappedData['UPI_TXN_ID']);
                    }
                })
                .on('end', () => {
                    console.log('CSV file successfully processed');
                    fs.access(filePath, fs.constants.F_OK, (err) => {
                        if (err) {
                            console.error(`File does not exist: ${filePath}`);
                            return resolve(); // Resolve even if file does not exist to avoid blocking the process
                        }
                        try {
                            fs.unlinkSync(filePath);
                            resolve();
                        } catch (error) {
                            console.error(`error deleting file: ${error}`);
                            reject(error);
                        }
                    });
                })
                .on('error', (error) => {
                    reject(error);
                });

        });
    }

    async checkFileExist(fileName: string) {
        try {
            const result = await this.dbSvc.checkIfFileExists(fileName);
            console.log(result.summary.result_rows);
            return parseInt(result.summary.result_rows) > 0 ? true : false;

        } catch (error) {
            return error;
        }

    }

    async getUploadedFileHistory() {
        try {
            const query = `SELECT * FROM FILE_UPLOAD_HISTORY`;
            const result = await this.clickdb.query({ query });
            const jsonResult: any = await result.json();
            console.log(jsonResult);
            // Map the data to the desired format
            const formattedData = jsonResult.data.map((row: any) => ({
                fileName: row.FILENAME,
                fileType: row.FILE_TYPE,
                count: row.DATACOUNT,
                size: parseInt(row.SIZE, 10),
                uploadedOn: row.UPLOAD_DATE,
                uploadedBy: row.UPLOAD_BY
            }));

            console.log(formattedData);
            return formattedData;
        } catch (error) {
            return error
        }
    }


}
