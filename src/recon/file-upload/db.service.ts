import { ClickHouseClient } from "@clickhouse/client";
import { InjectClickHouse } from "@md03/nestjs-clickhouse";
import { FileValidationService } from "./file-validation.service";
import { Injectable } from "@nestjs/common";
import { IFileUpload } from "./file-upload.service";
import { table } from "console";

@Injectable()
export class DBService {


    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient, private validator: FileValidationService
    ) { }


    async truncateAll() {
        const query = `TRUNCATE TABLE SWITCH_TXN;
        TRUNCATE TABLE NPCI_TXN;
        TRUNCATE TABLE INVALID_TXN;
        TRUNCATE TABLE DUPLICATE_TXN;
        TRUNCATE TABLE TWOWAY_RECON_TXN;
        TRUNCATE TABLE NON_RECON_TXN;
        TRUNCATE TABLE FILE_UPLOAD_HISTORY;
        `
        try {
            this.clickdb.command({ query: 'TRUNCATE TABLE SWITCH_TXN' });
            this.clickdb.command({ query: 'TRUNCATE TABLE NPCI_TXN' });
            this.clickdb.command({ query: 'TRUNCATE TABLE INVALID_TXN' });
            this.clickdb.command({ query: 'TRUNCATE TABLE DUPLICATE_TXN' });
            this.clickdb.command({ query: 'TRUNCATE TABLE TWOWAY_RECON_TXN' });
            this.clickdb.command({ query: 'TRUNCATE TABLE NON_RECON_TXN' });
            this.clickdb.command({ query: 'TRUNCATE TABLE FILE_UPLOAD_HISTORY' });
            return true;
        } catch (error) {
            throw error;
        }
    }

    async getAllCount() {

        const queries = [{ query: 'SELECT * FROM SWITCH_TXN', result: 0 },
        { query: 'SELECT * FROM NPCI_TXN', result: 0 },
        { query: 'SELECT * FROM INVALID_TXN', result: 0 },
        { query: 'SELECT * FROM DUPLICATE_TXN', result: 0 },
        { query: 'SELECT * FROM TWOWAY_RECON_TXN', result: 0 },
        { query: 'SELECT * FROM NON_RECON_TXN', result: 0 },
        { query: 'SELECT * FROM FILE_UPLOAD_HISTORY', result: 0 }];

        try {
            queries.map(async (q, idx) => {
                const r = await this.clickdb.query({ query: q.query });
                q.result = (await r.json()).data.length;
                console.log(q.query + ' :' + q.result);
            });
            return queries;
        } catch (error) {
            throw error;
        }
    }


    async insertSwitchDataToDB(txns: any[]) {
        const batchSize = 30000;
        const retries = 10;
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
            let attempt = 0;

            while (attempt < retries) {
                try {
                    console.log(`Inserting batch of ${batch.length} transactions...`);
                    await this.clickdb.exec({ query: `${query} ${values}` });
                    break; // exit the retry loop on success

                } catch (error) {
                    attempt++;
                    console.log(error);
                    console.error(`Error inserting data: ${error.message}`);
                }
            }
        }
    }


    async selectAllByTableName(tableName) {
        try {
            const r = await this.clickdb.query({ query: `SELECT * FROM ${tableName}` });
            return (await r.json()).data;
        } catch (error) {
            throw error;
        }
    }
    async insertNPCIDataToDB(txns: any[]) {
        const batchSize = 30000;
        const retries = 10;
        console.log(`started inserting npci data of length ${txns.length} records in batch of 16K rows per batch`);

        for (let i = 0; i < txns.length; i += batchSize) {
            const batch = txns.slice(i, i + batchSize);
            console.log(`inside batch ${i} to ${i + batchSize}`);
            const query = `INSERT INTO NPCI_TXN (TX_TYPE, UPI_TXN_ID, UPICODE, AMOUNT, TXN_DATE, TXN_TIME, RRN, PAYER_CODE, PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER, BEN_IFSC_CODE, BEN_ACC_NUMBER) VALUES`;
            const values = batch.map(item => (
                `('${item.TX_TYPE}', '${item.UPI_TXN_ID}', '${item.UPICODE}', ${item.AMOUNT}, '${item.TXN_DATE}', '${item.TXN_TIME}', '${item.RRN}', '${item.PAYER_CODE}', '${item.PAYER_VPA}', '${item.PAYEE_CODE}', '${item.PAYEE_VPA}', '${item.MCC}', '${item.REM_IFSC_CODE}', '${item.REM_ACC_NUMBER}', '${item.BEN_IFSC_CODE}', '${item.BEN_ACC_NUMBER}')`
            )).join(', ');
            let attempt = 0;
            while (attempt < retries) {
                try {
                    console.log(`Inserting batch of ${batch.length} transactions...`);
                    await this.clickdb.exec({ query: `${query} ${values}` });
                    break; // exit the retry loop on success
                } catch (error) {
                    attempt++;
                    console.log(error);
                    console.error(`Error inserting data: ${error.message}`);
                }
            }
        }
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

    async getLastUploadId() {
        const query = `SELECT MAX(UPLOAD_ID) FROM FILE_UPLOAD_HISTORY`;
        const result = await this.clickdb.query({ query });
        const record = (await result.json()).data[0]['MAX(UPLOAD_ID)'];
        return record == null || record == undefined || record == '' ? 0 : record
    }

    async insertFileHistory(fileUploads: IFileUpload[]) {
        console.log("Inserting file history records=>", fileUploads);
        const maxRetries = 10;
        const currentDateTimeISO = new Date().toISOString(); // Get the current date and time in ISO format
        const query = `INSERT INTO FILE_UPLOAD_HISTORY (UPLOAD_ID, FILENAME, SIZE, UPLOAD_DATE, TXNCOUNT,  UPLOAD_BY, FILE_TYPE) VALUES`;
        console.log('file upload history insertion started');

        //remove undefined fileUploadsId
        fileUploads = fileUploads.filter(file => file.uploadId != undefined || !isNaN(file.uploadId));

        const values = fileUploads.map(file => (
            `('${file.uploadId}', '${file.fileName}', '${file.fileSize}', '${currentDateTimeISO}','${file.count}', '${file.uploadBy}', '${file.fileType}')`
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

    checkIfFileExists(fileName: string) {
        try {
            const query = `SELECT * FROM FILE_UPLOAD_HISTORY WHERE FILENAME = '${fileName}'`;
            return this.clickdb.exec({ query });

        } catch (error) {
            return error
        }
    }

    deleteHistory(fileName: string, tableName: string, fileType: string, uploadDate: string, txnDate: string) {
        try {

            const query = `DELETE FROM FILE_UPLOAD_HISTORY WHERE fileName = '${fileName}' AND FILE_TYPE = '${fileType}' AND UPLOAD_DATE = '${uploadDate}'`;
            return this.clickdb.exec({ query }).then(() => {
                return this.clickdb.exec({ query: `DELETE FROM ${tableName} WHERE TXN_DATE = '${txnDate}'` });
            });
        } catch (error) {
            return error
        }
    }


    async fetchExistingTxnIdsFromDB(tableName: string, upiTxnIds: string[]): Promise<string[]> {

        const query = `
        SELECT UPI_TXN_ID
        FROM ${tableName}
        WHERE UPI_TXN_ID IN (${upiTxnIds.map(id => `'${id}'`).join(',')})
        AND TXN_DATE >= today() - 3
    `;
        const existingTxnIds = await this.clickdb.query({ query });
        const results = await existingTxnIds.json();
        return results.data.map((row: any) => row.UPI_TXN_ID);
    }

}