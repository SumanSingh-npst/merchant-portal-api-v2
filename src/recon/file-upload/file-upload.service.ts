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


@Injectable()
export class FileUploadService {
    private readonly uploadPath = path.join(__dirname, '..', 'uploads');
    private readonly duplicateTransactionsPath = path.join(__dirname, '..', 'duplicate-transactions');
    private readonly invalidValueTransactionsPath = path.join(__dirname, '..', 'missing-value-transactions');
    private ramUsed: number;
    private duplicateTransactions;
    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient, private validator: FileValidationService
    ) { }

    async validateAndStoreFiles(files: Multer.File[], isSwitchFile: boolean) {
        try {
            const startTime = performance.now();
            if (!fs.existsSync(this.uploadPath)) {
                fs.mkdirSync(this.uploadPath);
            }
            console.log('isSwitchFile: ', isSwitchFile);

            const duplicateTransactions = [];
            const invalidValueTransactions = [];
            const validTransactions = [];
            const transactionIds = new Set<string>();
            const fileProcessingPromises = files.map(file => this.processFile(file, isSwitchFile, transactionIds, duplicateTransactions, invalidValueTransactions, validTransactions));
            await Promise.all(fileProcessingPromises);
            const type = isSwitchFile ? 'Switch' : 'NPCI';
            this.saveTransactions(type, duplicateTransactions, invalidValueTransactions, validTransactions, isSwitchFile);

            isSwitchFile ? await this.insertSwitchDataToDB(validTransactions) : await this.insertNPCIDataToDB(validTransactions);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            return {
                totalTransactionCount: validTransactions.length + invalidValueTransactions.length + duplicateTransactions.length,
                validCount: validTransactions.length,
                missingCount: invalidValueTransactions.length,
                missingTransactions: invalidValueTransactions,
                duplicateCount: duplicateTransactions.length,
                duplicateTransactions: duplicateTransactions,
                totalSeconds: Math.floor(totalTime / 1000),
                ramUsed: this.ramUsed + " MB",
            };

        } catch (error) {
            console.error(error);
            throw new BadRequestException(`Error in file processing`, error);
        }
    }


    async validateAndStoreSwitchFile(files: Multer.File[]) {
        try {

            const startTime = performance.now();
            if (!fs.existsSync(this.uploadPath)) {
                fs.mkdirSync(this.uploadPath);
            }

            const transactionIds = new Set<string>();
            const validTransactions: any[] = [];
            const duplicateTransactions: any[] = [];
            const missingValueTransactions: any[] = [];
            console.log(`start processsing swithch file at ${startTime}`);

            const processFile = (file: Multer.File) => {
                return new Promise<void>((resolve, reject) => {
                    console.log(`creating stream of rows....for file ${file.path}`)
                    fs.createReadStream(file.path)
                        .pipe(fastcsv.parse({ headers: true }))
                        .on('data', (row) => {

                            const { isValid, processedRow } = this.validateRow(row, transactionIds);

                            if (isValid) {

                                validTransactions.push(processedRow);

                            } else {

                                missingValueTransactions.push(processedRow);
                            }

                            if (validTransactions.length >= 1000) {
                                this.insertBatch(validTransactions.splice(0, 1000));
                            }
                        })
                        .on('end', async () => {
                            console.log('stream processing finished...at ', Date.UTC);
                            if (validTransactions.length > 0) {
                                //start inserting into batch
                                await this.insertSwitchDataToDB(validTransactions);
                            }
                            resolve();
                        })
                        .on('error', (error) => {
                            reject(error);
                        });
                });
            };

            await Promise.all(files.map(file => processFile(file)));

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            return {
                validCount: validTransactions.length,
                invalidCount: missingValueTransactions.length,
                duplicateCount: duplicateTransactions.length,
                totalSeconds: Math.floor(totalTime / 1000),
                ramUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            };

        } catch (error) {

            console.error(error);
            throw new BadRequestException(`Error in file processing`, error);
        }
    }

    private validateRow(row: any, transactionIds: Set<string>) {
        let isValid = true;
        const processedRow = { ...row };

        // Perform your validations here
        // Example: Validate UPI Txn Id using regex
        const txnIdRegex = /^[a-zA-Z0-9]{8,}$/;
        if (!txnIdRegex.test(row['UPI_TXN_ID'])) {
            isValid = false;
        }

        // Deduplication
        if (transactionIds.has(row['UPI_TXN_ID'])) {
            this.duplicateTransactions.push(row);
            isValid = false;
        } else {
            transactionIds.add(row['UPI_TXN_ID']);
        }

        return { isValid, processedRow };
    }

    private async insertBatch(batch: any[]) {
        // Insert the batch into ClickHouse;
        const query = `INSERT INTO my_table VALUES `
        // await this.clickdb.insert('INSERT INTO my_table VALUES');
    }

    private processFile(file: Multer.File, isSwitchFile: boolean, transactionIds: Set<string>, duplicateTransactions: any[], invalidValueTransactions: any[], validTransactions: any[]): Promise<void> {
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
                        invalidValueTransactions.push(mappedData);
                    } else if (transactionIds.has(mappedData['UPI_TXN_ID'])) {
                        duplicateTransactions.push(mappedData);
                    } else {
                        validTransactions.push(mappedData);
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
        });
    }

    private async saveTransactions(type: string, duplicateTransactions: any[], invalidValueTransactions: any[], validTransactions: any[], isSwitchFile: boolean) {
        const invalidValueTransactionsPath = path.join(this.invalidValueTransactionsPath, type);
        const duplicateTransactionsPath = path.join(this.duplicateTransactionsPath, type);

        if (!fs.existsSync(invalidValueTransactionsPath)) {
            fs.mkdirSync(invalidValueTransactionsPath, { recursive: true });
        }

        if (!fs.existsSync(duplicateTransactionsPath)) {
            fs.mkdirSync(duplicateTransactionsPath, { recursive: true });
        }
        //  await this.insertIntoDB(validTransactions, isSwitchFile ? 'SWITCH_TXN' : 'NPCI_TXN');
        fs.writeFileSync(path.join(invalidValueTransactionsPath, 'missing_transactions.json'), JSON.stringify(invalidValueTransactions, null, 2));
        fs.writeFileSync(path.join(duplicateTransactionsPath, 'duplicate_transactions.json'), JSON.stringify(duplicateTransactions, null, 2));
    }

    private async insertSwitchDataToDB(txns: any[]) {
        const batchSize = 16384;
        console.log(`started inserting ${txns.length} records in batch of 16K rows per batch`);

        for (let i = 0; i < txns.length; i += batchSize) {
            const batch = txns.slice(i, i + batchSize);
            console.log(`inside batch ${i} to ${i + batchSize}`);
            const query = `
      INSERT INTO SWITCH_TXN (TXN_DATE,TXN_TIME, AMOUNT, UPICODE, STATUS, RRN, EXT_TXN_ID, PAYER_VPA, NOTE, PAYEE_VPA, UPI_TXN_ID, MCC) SETTINGS async_insert=1, wait_for_async_insert=1 VALUES
    `;

            const values = batch.map(item => (
                `('${item.TXN_DATE}', '${item.TXN_TIME}', '${item.AMOUNT}', '${item.UPICODE}', '${item.STATUS}', '${item.RRN}', '${item.EXT_TXN_ID || null}', '${item.PAYER_VPA}', '${item.NOTE}', '${item.PAYEE_VPA}', '${item.UPI_TXN_ID}', '${item.MCC}')`
            )).join(', ');
            this.ramUsed = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);

            try {
                this.ramUsed = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);
                console.log(`Inserting batch of ${batch.length} transactions...`);
                await this.clickdb.exec({ query: `${query} ${values}` });
                this.ramUsed = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);
                console.log(`total of ${txns.length} switch txns inserted successfully`);
            } catch (error) {
                console.log(error);
                console.error(`Error inserting data: ${error.message}`);
            }
        }

    }

    private async insertNPCIDataToDB(txns: any[]) {
        const query = `INSERT INTO NPCI_TXN (TX_TYPE, UPI_TXN_ID, UPICODE, AMOUNT, TXN_DATE, TXN_TIME, RRN, PAYER_CODE, PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER, BEN_IFSC_CODE, BEN_ACC_NUMBER)  VALUES`;
        const values = txns.map(item => (
            `('${item.TX_TYPE}', '${item.UPI_TXN_ID}', '${item.UPICODE}', ${item.AMOUNT}, '${this.validator.convertNPCIDate(item.TXN_DATE)}','${item.TXN_TIME}', '${item.RRN}', '${item.PAYER_CODE}', '${item.PAYER_VPA}', '${item.PAYEE_CODE}', '${item.PAYEE_VPA}', '${item.MCC}', '${item.REM_IFSC_CODE}', '${item.REM_ACC_NUMBER}','${item.BEN_IFSC_CODE}', '${item.BEN_ACC_NUMBER}')`
        )).join(', ');

        //const settings = `SETTINGS async_insert=1, wait_for_async_insert=1`;

        try {
            this.ramUsed = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);
            await this.clickdb.exec({ query: `${query} ${values}` });
            this.ramUsed = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);

            console.log(`total of ${txns.length} npci txns inserted successfully`);

        } catch (error) {
            console.error(`Error inserting data: ${error.message}`);
        }
    }

}