import { Multer } from 'multer';
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { performance, PerformanceObserver } from 'perf_hooks';
import { ClickHouseClient } from '@depyronick/nestjs-clickhouse';

@Injectable()
export class FileUploadService {

    private readonly uploadPath = path.join(__dirname, '..', 'uploads');
    private readonly duplicateTransactionsPath = path.join(__dirname, '..', 'duplicate-transactions');
    private readonly missingValueTransactionsPath = path.join(__dirname, '..', 'missing-value-transactions');
    private readonly validTransactionsPath = path.join(__dirname, '..', 'valid-transactions');

    constructor(@Inject('clickhouse_server')
    private readonly clickdb: ClickHouseClient,) {

    }
    async validateAndStoreFiles(files: Multer.File[], isSwitchFile: boolean) {
        try {
            const startTime = performance.now();
            if (!fs.existsSync(this.uploadPath)) {
                fs.mkdirSync(this.uploadPath);
            }
            let totalTransactions = 0;
            const duplicateTransactions = [];
            const missingValueTransactions = [];
            const validTransactions = [];
            const transactionIds = new Set();

            const fileProcessingPromises = files.map(file => {
                return new Promise<void>((resolve, reject) => {
                    const filePath = path.join(this.uploadPath, file.originalname);
                    fs.writeFileSync(filePath, file.buffer);

                    const headers = isSwitchFile ? [
                        'Date', 'Amt', 'Code', 'Status', 'RRN', 'ext id', 'Payee vpa', 'Notes', 'Payer vpa', '\\N', 'Txn id', 'MCC'
                    ] : [
                        'TX', '-', 'UPI Txn id', 'RRN', 'Code', 'Date', 'Time', 'Amount', '-', '-', '-', '-', 'Payer PSP', '-', 'Payer VPA', 'Payee PSP', 'MCC', 'Payee VPA', 'Remitter Bank', '-', '-', '-', 'Beneficiary Bank', '-', '-', '-'
                    ];

                    fs.createReadStream(filePath)
                        .pipe(csv({ headers }))
                        .on('data', (data) => {
                            totalTransactions++;
                            // Map CSV data to required field names
                            const mappedData = {
                                'Txn id': data['UPI Txn id'] || data['Txn id'],
                                'Amount': data['Amount'] || data['Amt'],
                                'Date': data['Date'],
                                'RRN': data['RRN'],
                                'Payee vpa': data['Payee vpa'] || data['Payee VPA'],
                                'Payer vpa': data['Payer vpa'] || data['Payer VPA']
                            };

                            // Check for missing required fields
                            const requiredFields = ['Txn id', 'Amount', 'Date', 'RRN', 'Payee vpa', 'Payer vpa'];
                            const missingFields = requiredFields.some(field => !mappedData[field]);

                            if (missingFields) {
                                missingValueTransactions.push(mappedData);
                            } else if (transactionIds.has(mappedData['Txn id'])) {

                                duplicateTransactions.push(mappedData);
                            } else {
                                transactionIds.add(mappedData['Txn id']);
                                validTransactions.push(mappedData);
                            }
                        })
                        .on('end', () => {
                            console.log(`Finished processing file: ${file.originalname}`);
                            fs.unlinkSync(filePath);
                            resolve();
                        })
                        .on('error', (error) => {
                            console.log(`Error processing file: ${file.originalname}`);
                            reject(error);
                        });
                });
            });
            await Promise.all(fileProcessingPromises).catch(error => {
                throw new BadRequestException(`got catch error in file processing file`, error);
            });


            const type = isSwitchFile ? 'Switch' : 'NPCI';
            const validTransactionsPath = path.join(this.validTransactionsPath, type);
            const missingValueTransactionsPath = path.join(this.missingValueTransactionsPath, type);
            const duplicateTransactionsPath = path.join(this.duplicateTransactionsPath, type);

            if (!fs.existsSync(validTransactionsPath)) {
                fs.mkdirSync(validTransactionsPath, { recursive: true });
                console.log('Created directory: ' + validTransactionsPath);
            }

            if (!fs.existsSync(missingValueTransactionsPath)) {
                fs.mkdirSync(missingValueTransactionsPath, { recursive: true });
                console.log('Created missing directory: ' + missingValueTransactionsPath);
            }

            if (!fs.existsSync(duplicateTransactionsPath)) {
                fs.mkdirSync(duplicateTransactionsPath, { recursive: true });
                console.log('Created duplicate directory: ' + duplicateTransactionsPath);
            }

            //for successful parsed switch file write those into the database of clickhouse
            //for succesful parsed npci file write those into the database of clickhouse

            //const validFilePath = path.join(validTransactionsPath, 'valid_transactions.json');
            //fs.writeFileSync(validFilePath, JSON.stringify(validTransactions, null, 2,));

            isSwitchFile ?
                await this.insertIntoDB(validTransactions, 'SWITCH_TXN') : await this.insertIntoDB(validTransactions, 'NPCI_TXN');

            const missingFilePath = path.join(missingValueTransactionsPath, 'missing_transactions.json');
            fs.writeFileSync(missingFilePath, JSON.stringify(missingValueTransactions, null, 2));

            const duplicateFilePath = path.join(duplicateTransactionsPath, 'duplicate_transactions.json');
            fs.writeFileSync(duplicateFilePath, JSON.stringify(duplicateTransactions, null, 2));

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            return {
                totalTransactions,
                validCount: validTransactions.length,
                invalidCount: missingValueTransactions.length,
                duplicateCount: duplicateTransactions.length,
                totalSeconds: Math.floor(totalTime / 1000),
                ramUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
            };

        } catch (error) {
            throw error;
        }

    }



    async insertIntoDB(txns: any[], tableName: string) {
        return new Promise((resolve, reject) => {
            this.clickdb.insertPromise(tableName, txns).then(() => {
                resolve(true);
            }).catch(error => {
                console.log(error);
                reject(error);
            });
        })

    }

}
