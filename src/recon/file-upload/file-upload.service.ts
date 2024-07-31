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

    async validateAndStoreFiles(files: Multer.File[], isSwitchFile: boolean) {
        try {
            const startTime = performance.now();
            if (!fs.existsSync(this.uploadPath)) {
                fs.mkdirSync(this.uploadPath);
            }
            console.log('isSwitchFile: ', isSwitchFile);

            const transactionIds = new Set<string>();
            const fileProcessingPromises = files.map(file => this.processFile(file, isSwitchFile, transactionIds));
            await Promise.all(fileProcessingPromises);
            isSwitchFile ? await this.dbSvc.insertSwitchDataToDB(this.validTXNS) : await this.dbSvc.insertNPCIDataToDB(this.validTXNS);
            await this.dbSvc.insertJunkDataToDB(this.invalidTXNS, isSwitchFile, 'INVALID_TXN');
            await this.dbSvc.insertJunkDataToDB(this.duplicateTXNS, isSwitchFile, 'DUPLICATE_TXN');
            await this.dbSvc.insertJunkDataToDB(this.missingTXNS, isSwitchFile, 'MISSING_TXN');
            await this.dbSvc.insertFileHistory(this.fileUploads);
            console.log(`File processing took ${performance.now() - startTime} milliseconds`);
            return { status: true, msg: `File processing took ${(performance.now() - startTime) / 60000} minutes` };

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
            //check if file already exists or not in db?
            this.checkFileExist(file.originalname).then(r => {
                if (r) {
                    this.fileUploads.push({ fileName: file.originalname, fileSize: file.size, fileType: isSwitchFile ? 'SWITCH' : 'NPCI', count: 0, uploadBy: 'admin', isDuplicate: true });
                    resolve()
                }
                else {
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
                            this.fileUploads.push({ fileName: file.originalname, fileSize: file.size, fileType: isSwitchFile ? 'SWITCH' : 'NPCI', count: mappedData.length, uploadBy: 'admin' });
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
                            fs.unlinkSync(filePath);
                            resolve();
                        })
                        .on('error', (error) => {
                            reject(error);
                        });
                }
            }).catch(e => {
                console.error(e);
                reject(e);
            })

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


}
