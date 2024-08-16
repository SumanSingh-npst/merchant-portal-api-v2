import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { performance } from 'perf_hooks';
import type { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { FileValidationService } from './file-validation.service';
import { DBService } from './db.service';
import { Multer } from 'multer';

export interface IFileUpload {
    fileName: string;
    fileSize: number;
    fileType: string;
    count: number;
    uploadBy: string;
    isDuplicate?: boolean;
    uploadId?: number;
}

@Injectable()
export class FileUploadService {

    private readonly uploadPath = path.join(__dirname, '..', 'uploads');
    private transactionIds = new Set<string>();
    private duplicateTXNS: any[] = [];
    private invalidTXNS: any[] = [];
    private validTXNS: any[] = [];

    private fileUploadHistoryData: IFileUpload[] = [];
    constructor(
        private dbSvc: DBService,
        @InjectClickHouse() private readonly clickdb: ClickHouseClient,
        private validator: FileValidationService
    ) { }

    async checkDuplicateUploads(files: Multer.File[], isSwitch: boolean): Promise<IFileUpload[]> {
        const uploadedFiles = await this.getFileUploadedHistory();
        const response: IFileUpload[] = [];
        this.ensureUploadPathExists();
        const fileProcessingPromises = files.map((file, idx) =>
            this.processSingleFile(file, isSwitch, uploadedFiles, response, idx)
        );
        await Promise.all(fileProcessingPromises);
        this.fileUploadHistoryData = response;
        return response;
    }

    private ensureUploadPathExists() {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath);
        }
    }

    private async processSingleFile(file: Multer.File, isSwitch: boolean, uploadedFiles: IFileUpload[], response: IFileUpload[], idx: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const isDuplicate = uploadedFiles.some(uploadedFile => uploadedFile.fileName === file.originalname);

            if (isDuplicate) {
                response.push(this.createFileUploadResponse(file, isSwitch, true, 0));
                return resolve();
            }

            response.push(this.createFileUploadResponse(file, isSwitch, false, 0));
            const filePath = path.join(this.uploadPath, file.originalname);

            fs.writeFileSync(filePath, file.buffer);

            let recordCount = 0;

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', () => recordCount++)
                .on('end', () => {
                    response[idx].count = recordCount;
                    this.cleanupFile(filePath, resolve);
                })
                .on('error', (err) => reject(err));
        });
    }

    private createFileUploadResponse(file: Multer.File, isSwitch: boolean, isDuplicate: boolean, count: number): IFileUpload {
        return {

            fileName: file.originalname,
            fileSize: file.size,
            count: count,
            fileType: isSwitch ? 'SWITCH' : 'NPCI',
            uploadBy: '',
            isDuplicate: isDuplicate,
        };
    }

    private cleanupFile(filePath: string, resolve: () => void) {
        console.log(filePath);
        try {
            fs.unlinkSync(filePath);
            resolve();
        } catch (error) {
            resolve();
        }

    }

    async validateAndStoreFiles(files: Multer.File[], isSwitchFile: boolean) {
        try {
            const startTime = performance.now();
            this.ensureUploadPathExists();
            const response = await this.checkDuplicateUploads(files, isSwitchFile);
            const nonDuplicateFiles = files.filter(file =>
                !response.some(res => res.fileName === file.originalname && res.isDuplicate)
            );
            if (nonDuplicateFiles.length === 0) {
                return { status: false, msg: 'some files are already uploaded into the portal earlier. remove them and reupload' };
            }
            let lastId = parseInt(await this.dbSvc.getLastUploadId());
            this.fileUploadHistoryData = nonDuplicateFiles.map(file => {
                lastId++;
                return {
                    fileName: file.originalname,
                    fileSize: file.size,
                    fileType: isSwitchFile ? 'SWITCH' : 'NPCI',
                    count: 0, // To be updated after processing
                    uploadBy: '', // Set appropriately
                    isDuplicate: false,
                    uploadId: lastId,
                };
            });

            await this.processFiles(nonDuplicateFiles, isSwitchFile);

            await this.storeDataToDatabase(isSwitchFile);
            const processingTime = (performance.now() - startTime) / 60000;
            console.log(`File processing took ${processingTime} minutes`);
            return { status: true, duplicateFiles: response, msg: `File processing took ${processingTime} minutes` };
        } catch (error) {
            console.error('Error during file processing:', error);
            throw new BadRequestException('Error in file processing', error.message);
        } finally {
            this.cleanupAfterProcessing();
        }
    }

    private async processFiles(nonDuplicateFiles: Multer.File[], isSwitchFile: boolean) {
        const fileProcessingPromises = this.fileUploadHistoryData.map(fileRecord => {
            const file = nonDuplicateFiles.find(f => f.originalname === fileRecord.fileName);
            if (file) {
                return this.processFile(file, isSwitchFile, fileRecord.uploadId);
            }
            return Promise.resolve(); // No-op for unmatched files
        });
        await Promise.all(fileProcessingPromises);
    }

    private async processFile(file: Multer.File, isSwitchFile: boolean, uploadId: number): Promise<void> {
        const filePath = path.join(this.uploadPath, file.originalname);
        const headers = this.getHeaders(isSwitchFile);
        fs.writeFileSync(filePath, file.buffer);
        let recordCount = 0;
        return new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv({ headers }))
                .on('data', (data) => {
                    this.handleCSVData(data, isSwitchFile, uploadId);
                    recordCount++;
                })
                .on('end', () => {
                    // Update the file count in fileUploadHistoryData
                    const fileRecord = this.fileUploadHistoryData.find(f => f.uploadId === uploadId);
                    if (fileRecord) {
                        fileRecord.count = recordCount;
                    }
                    this.cleanupFile(filePath, resolve);
                })
                .on('error', (error) => reject(error));
        });
    }



    private handleCSVData(data: any, isSwitchFile: boolean, uploadId: number) {

        const mappedData = this.validator.mapData(data, isSwitchFile, uploadId);
        if (!this.validator.validateRow(mappedData)) {
            this.invalidTXNS.push(mappedData);
        } else if (this.transactionIds.has(mappedData['UPI_TXN_ID'])) {
            this.duplicateTXNS.push(mappedData);
        } else {
            this.validTXNS.push(mappedData);
            this.transactionIds.add(mappedData['UPI_TXN_ID']);
        }
    }

    private getHeaders(isSwitchFile: boolean): string[] {
        return isSwitchFile
            ? ['TXN_DATE', 'AMOUNT', 'UPICODE', 'STATUS', 'RRN', 'EXT_TXN_ID', 'PAYEE_VPA', 'NOTE', 'PAYER_VPA', '\\N', 'UPI_TXN_ID', 'MCC']
            : ['NA', 'TX_TYPE', 'UPI_TXN_ID', 'RRN', 'UPICODE', 'TXN_DATE', 'TXN_TIME', 'AMOUNT', 'UMN', 'MAPPER_ID', 'INIT_MODE', 'PURPOSE_CODE', 'PAYER_CODE', 'PAYER_MCC', 'PAYER_VPA', 'PAYEE_CODE', 'MCC', 'PAYEE_VPA', 'REM_CODE', 'REM_IFSC_CODE', 'REM_ACC_TYPE', 'REM_ACC_NUMBER', 'BEN_CODE', 'BEN_IFSC_CODE', 'BEN_ACC_TYPE', 'BEN_ACC_NUMBER'];
    }

    private async storeDataToDatabase(isSwitchFile: boolean) {
        const existingIds = await this.dbSvc.fetchExistingTxnIdsFromDB(
            isSwitchFile ? 'SWITCH_TXN' : 'NPCI_TXN',
            this.validTXNS.map(txn => txn['UPI_TXN_ID'])
        );

        // Identify duplicates in the current batch
        const tmpDuplicates = this.validTXNS.filter(txn => existingIds.includes(txn['UPI_TXN_ID']));
        console.log('Total duplicate Ids', tmpDuplicates);

        // Update the duplicateTXNS array with newly identified duplicates
        this.duplicateTXNS.push(...tmpDuplicates);

        // Filter out validTXNS by removing those that are already existing in the database
        this.validTXNS = this.validTXNS.filter(txn => !existingIds.includes(txn['UPI_TXN_ID']));

        if (isSwitchFile) {
            await this.dbSvc.insertSwitchDataToDB(this.validTXNS);
        } else {
            await this.dbSvc.insertNPCIDataToDB(this.validTXNS);
        }

        console.log('duplicate txn length=>', this.duplicateTXNS.length);
        await this.dbSvc.insertJunkDataToDB(this.invalidTXNS, isSwitchFile, 'INVALID_TXN');
        await this.dbSvc.insertJunkDataToDB(this.duplicateTXNS, isSwitchFile, 'DUPLICATE_TXN');
        await this.dbSvc.insertFileHistory(this.fileUploadHistoryData);
    }

    private cleanupAfterProcessing() {
        fs.rmSync(this.uploadPath, { recursive: true, force: true });
        this.invalidTXNS = [];
        this.validTXNS = [];
        this.duplicateTXNS = [];
        this.transactionIds.clear();
        console.log('File processing completed');
    }

    async checkFileExist(fileName: string): Promise<boolean> {
        try {
            const result = await this.dbSvc.checkIfFileExists(fileName);
            return parseInt(result.summary.result_rows, 10) > 0;
        } catch (error) {
            console.error('Error checking file existence:', error);
            throw error;
        }
    }

    async getFileUploadedHistory() {
        try {
            const query = `SELECT * FROM FILE_UPLOAD_HISTORY ORDER BY FILE_UPLOAD_HISTORY.UPLOAD_DATE DESC;`;
            const result = await this.clickdb.query({ query });
            const jsonResult: any = await result.json();
            return jsonResult.data.map((row: any) => ({
                uploadId: row.UPLOAD_ID,
                fileName: row.FILENAME,
                fileType: row.FILE_TYPE,
                count: row.TXNCOUNT,
                size: parseInt(row.SIZE, 10),
                uploadedOn: row.UPLOAD_DATE,
                uploadedBy: row.UPLOAD_BY,
            }));
        } catch (error) {
            console.error('Error retrieving uploaded file history:', error);
            throw error;
        }
    }


    async deleteFileHistory(fileName: string, uploadId: number, fileType: string) {
        try {
            //step 1: first remove all the existing data with the upload_id from Switch and NPCI table

            fileType === 'SWITCH' ? await this.clickdb.exec({ query: `DELETE FROM SWITCH_TXN WHERE UPLOAD_ID = '${uploadId}';` }) : await this.clickdb.exec({ query: `DELETE FROM NPCI_TXN WHERE UPLOAD_ID = '${uploadId}';` });
            const query = `DELETE FROM FILE_UPLOAD_HISTORY WHERE FILENAME = '${fileName}';`;
            const res = await this.clickdb.exec({ query });
            console.log(res.summary);
            return true;
        } catch (error) {
            console.log(error);
            throw new HttpException('Error deleting file history', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
