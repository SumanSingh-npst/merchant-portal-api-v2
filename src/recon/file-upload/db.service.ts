import { ClickHouseClient } from "@clickhouse/client";
import { InjectClickHouse } from "@md03/nestjs-clickhouse";
import { FileValidationService } from "./file-validation.service";
import { Injectable } from "@nestjs/common";
import { IFileUpload } from "./file-upload.service";

@Injectable()
export class DBService {

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient, private validator: FileValidationService
    ) { }


    async insertSwitchDataToDB(txns: any[]) {
        const batchSize = 16384;
        const retries = 10;
        console.log(`started inserting ${txns.length} records in batch of 16K rows per batch`);

        for (let i = 0; i < txns.length; i += batchSize) {
            const batch = txns.splice(i, i + batchSize);
            console.log(`inside batch ${i} to ${i + batchSize}`);
            const query = `
      INSERT INTO SWITCH_TXN (TXN_DATE,TXN_TIME, AMOUNT, UPICODE, STATUS, RRN, EXT_TXN_ID, PAYER_VPA, NOTE, PAYEE_VPA, UPI_TXN_ID, MCC) SETTINGS async_insert=1, wait_for_async_insert=1 VALUES
    `;
            const values = batch.map(item => (
                `('${item.TXN_DATE}', '${item.TXN_TIME}', '${item.AMOUNT}', '${item.UPICODE}', '${item.STATUS}', '${item.RRN}', '${item.EXT_TXN_ID || null}', '${item.PAYER_VPA}', '${item.NOTE}', '${item.PAYEE_VPA}', '${item.UPI_TXN_ID}', '${item.MCC}')`
            )).join(', ');
            try {
                console.log(`Inserting batch of ${batch.length} transactions...`);
                await this.clickdb.exec({ query: `${query} ${values}` });
            } catch (error) {
                console.log(error);
                console.error(`Error inserting data: ${error.message}`);
            }
        }
    }

    async insertNPCIDataToDB(txns: any[]) {
        const batchSize = 10000;
        const maxRetries = 10;
        console.log(`started inserting ${txns.length} records in batch of ${batchSize} rows per batch`);

        const txnLength = txns.length;
        for (let i = 0; i < txnLength; i += batchSize) {
            const batch = txns.splice(i, i + batchSize);
            console.log(`inside batch ${i} to ${i + batchSize}`);
            const query = `INSERT INTO NPCI_TXN (TX_TYPE, UPI_TXN_ID, UPICODE, AMOUNT, TXN_DATE, TXN_TIME, RRN, PAYER_CODE, PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER, BEN_IFSC_CODE, BEN_ACC_NUMBER) VALUES`;
            const values = batch.map(item => (
                `('${item.TX_TYPE}', '${item.UPI_TXN_ID}', '${item.UPICODE}', ${item.AMOUNT}, '${this.validator.convertNPCIDate(item.TXN_DATE)}', '${item.TXN_TIME}', '${item.RRN}', '${item.PAYER_CODE}', '${item.PAYER_VPA}', '${item.PAYEE_CODE}', '${item.PAYEE_VPA}', '${item.MCC}', '${item.REM_IFSC_CODE}', '${item.REM_ACC_NUMBER}', '${item.BEN_IFSC_CODE}', '${item.BEN_ACC_NUMBER}')`
            )).join(', ');

            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    console.log(`Inserting batch of ${batch.length} npci transactions... (attempt ${attempt + 1})`);
                    await this.clickdb.exec({ query: `${query} ${values}` });
                    console.log(`Batch from ${i} to ${i + batch.length} inserted successfully`);
                    break; // exit the retry loop on success
                } catch (error) {
                    attempt++;
                    console.error(`Error inserting batch from ${i} to ${i + batch.length} (attempt ${attempt}): ${error.message}`);
                    if (attempt >= maxRetries) {
                        console.error(`Failed to insert batch after ${maxRetries} attempts. Exiting.`);
                        throw error; // rethrow the error after exhausting all retries
                    }
                }
            }
        }
        console.log(`Total of ${txns.length} npci txns processed successfully`);
    }


    /**
 * Inserts junk data into a database table. This junk data are transactions which are missing values, contain invalid values, or are duplicated.
 *
 * @param {any[]} txns - The array of transactions to insert.
 * @param {boolean} isSwitch - Indicates if the data is from a switch.
 * @param {string} tableName - The name of the table to insert the data into.
 * @return {Promise<void>} A promise that resolves when the data is inserted.
 */
    async insertJunkDataToDB(txns: any[], isSwitch: boolean, tableName: string) {
        const batchSize = 16384;
        const maxRetries = 10;
        console.log(`Started inserting missing /invalid data of size ${txns.length} records in batches of ${batchSize} rows per batch`);
        const isNPCI = isSwitch ? 'FALSE' : 'TRUE';
        for (let i = 0; i < txns.length; i += batchSize) {
            const batch = txns.splice(i, i + batchSize);
            console.log(`Inside batch ${i} to ${i + batchSize}`);

            const query = `INSERT INTO ${tableName} 
            (UPI_TXN_ID, RRN, TXN_DATE, TXN_TIME, AMOUNT, PAYER_VPA, PAYEE_VPA, UPICODE, STATUS, IS_NPCI, IS_SWITCH, IS_CBS) 
            VALUES`;
            const values = batch.map(item => (
                `('${item.UPI_TXN_ID}', '${item.RRN}', '${item.TXN_DATE}', '${item.TXN_TIME}', ${item.AMOUNT}, 
              '${item.PAYER_VPA}', '${item.PAYEE_VPA}', '${item.UPICODE}', '${item.STATUS}', '${isNPCI}', '${isSwitch}', 'FALSE')`
            )).join(', ');

            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    console.log(`Inserting batch of ${batch.length} into missing/invalid transactions... (attempt ${attempt + 1})`);
                    await this.clickdb.exec({ query: `${query} ${values}` });
                    console.log(`Batch from ${i} to ${i + batch.length} inserted successfully`);
                    break; // exit the retry loop on success
                } catch (error) {
                    attempt++;
                    console.error(`Error inserting batch from ${i} to ${i + batch.length} (attempt ${attempt}): ${error.message}`);
                    if (attempt >= maxRetries) {
                        console.error(`Failed to insert batch after ${maxRetries} attempts. Exiting.`);
                        throw error; // rethrow the error after exhausting all retries
                    }
                }
            }
        }
        console.log(`Total of ${txns.length} missing/invalid transactions processed successfully`);
    }

    async insertFileHistory(fileUploads: IFileUpload[]) {
        const maxRetries = 10;
        const currentDateTimeISO = new Date().toISOString(); // Get the current date and time in ISO format

        for (let i = 0; i < fileUploads.length; i++) {
            console.log('file upload history insertion started')
            const query = `INSERT INTO FILE_UPLOAD_HISTORY (FILENAME, SIZE, UPLOAD_DATE, UPLOAD_BY, FILE_TYPE, DATACOUNT) VALUES`;
            const values = fileUploads.map(file => (
                `('${file.fileName}', '${file.fileSize}', '${currentDateTimeISO}', '${file.uploadBy}', '${file.fileType}', '${file.count}')`
            )).join(', ');

            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    await this.clickdb.exec({ query: `${query} ${values}` });
                    console.log('file upload history completed successfully')
                    break; // exit the retry loop on success
                } catch (error) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        console.error(`Failed to insert file upload history after ${maxRetries} attempts. Exiting.`);
                        throw error; // rethrow the error after exhausting all retries
                    }
                }
            }
        }
    }

    checkIfFileExists(fileName: string) {
        try {
            const query = `SELECT * FROM FILE_UPLOAD_HISTORY WHERE FILENAME = '${fileName}'`;
            return this.clickdb.exec({ query });
        } catch (error) {
            return error
        }
    }

}