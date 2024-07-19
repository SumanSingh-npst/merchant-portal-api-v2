import { Multer } from 'multer';
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { performance, PerformanceObserver } from 'perf_hooks';
import type { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { FileValidationService } from './file-validation.service';


@Injectable()
export class FileUploadService {
    private readonly uploadPath = path.join(__dirname, '..', 'uploads');
    private readonly duplicateTransactionsPath = path.join(__dirname, '..', 'duplicate-transactions');
    private readonly invalidValueTransactionsPath = path.join(__dirname, '..', 'missing-value-transactions');

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient, private validator: FileValidationService
    ) { }

    async validateAndStoreFiles(files: Multer.File[], isSwitchFile: boolean) {
        try {
            const startTime = performance.now();
            if (!fs.existsSync(this.uploadPath)) {
                fs.mkdirSync(this.uploadPath);
            }

            let totalTransactions = 0;
            const duplicateTransactions = [];
            const invalidValueTransactions = [];
            const validTransactions = [];

            const transactionIds = new Set<string>();

            const fileProcessingPromises = files.map(file => this.processFile(file, isSwitchFile, transactionIds, duplicateTransactions, invalidValueTransactions, validTransactions));
            await Promise.all(fileProcessingPromises);

            const type = isSwitchFile ? 'Switch' : 'NPCI';
            // await this.saveTransactions(type, duplicateTransactions, invalidValueTransactions, validTransactions, isSwitchFile);
            //await this.insertInDB(validTransactions);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            return {
                totalTransactions,
                validCount: validTransactions.length,
                invalidCount: invalidValueTransactions.length,
                duplicateCount: duplicateTransactions.length,
                totalSeconds: Math.floor(totalTime / 1000),
                ramUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
            };

        } catch (error) {
            throw new BadRequestException(`Error in file processing`, error);
        }
    }

    private processFile(file: Multer.File, isSwitchFile: boolean, transactionIds: Set<string>, duplicateTransactions: any[], invalidValueTransactions: any[], validTransactions: any[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const filePath = path.join(this.uploadPath, file.originalname);
            fs.writeFileSync(filePath, file.buffer);

            const headers = isSwitchFile ? [
                'TXN_DATE', 'AMOUNT', 'UPICODE', 'STATUS', 'RRN', 'EXT_TXN_ID', 'PAYER_VPA', 'NOTE', 'PAYEE_VPA', '\\N', 'UPI_TXN_ID', 'MCC'
            ] : [
                'NA', 'TX_TYPE', 'UPI_TXN_ID', 'RRN', 'UPICODE', 'TXN_DATE', 'TXN_TIME', 'AMOUNT', 'UMN', 'MAPPER_ID', 'INIT_MODE', 'PURPOSE_CODE', 'PAYER_CODE', 'PAYER_MCC', 'PAYER_VPA', 'PAYEE_CODE', 'MCC', 'PAYEE_VPA', 'REM_CODE', 'REM_IFSC_CODE', 'REM_ACC_TYPE', 'REM_ACC_NUMBER', 'BEN_CODE', 'BEN_IFSC_CODE', 'BEN_ACC_TYPE', 'BEN_ACC_NUMBER'
            ];

            let totalTransactions = 0;
            fs.createReadStream(filePath)
                .pipe(csv({ headers }))
                .on('data', (data) => {
                    totalTransactions++;
                    const mappedData = this.validator.mapData(data, isSwitchFile);
                    if (this.validator.hasInvalidFields(mappedData)) {
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


    insertInDB(txns: any[]) {
        console.log(txns);
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

    private async insertIntoDB(txns: any[], tableName: string) {
        const query = `INSERT INTO ${tableName} SETTINGS async_insert = 1, wait_for_async_insert = 1 VALUES`;
        const values = txns.map(txn => `(${Object.values(txn).map(value => `'${value}'`).join(', ')})`).join(', ');

        try {
            console.log(values);
            //await this.clickdb.command({ query: `${query} ${values}` });
        } catch (error) {
            console.error(`Error inserting data: ${error.message}`);
        }
    }
}