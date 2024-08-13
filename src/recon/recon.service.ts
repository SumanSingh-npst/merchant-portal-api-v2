import { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { FileValidationService } from './file-upload/file-validation.service';
@Injectable()
export class ReconService {
    private readonly logger = new Logger(ReconService.name);
    private readonly BATCH_SIZE = 50000;
    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient, private validator: FileValidationService
    ) { }


    async initiate2WayRecon() {
        try {
            this.logger.log('Starting reconciliation process...');

            // Step 1: Create temporary tables for matched and unmatched transactions
            await this.createTemporaryTables();

            // Step 2: Insert matched transactions into TWOWAY_RECON_TXN in batches
            await this.insertMatchedTransactions();

            // Step 3: Insert unmatched transactions into NON_RECON_TXN in batches
            await this.insertUnmatchedTransactions();

            // Step 4: Delete matched transactions from SWITCH_TXN and NPCI_TXN
            await this.deleteMatchedTransactions();

            this.logger.log('Reconciliation process completed successfully.');
            // Notify the system or user about the completion of the reconciliation process
            return this.notifyCompletion();

        } catch (error) {
            this.logger.error('Error during reconciliation process', error.stack);
            throw error; // Re-throw the error after logging it
        } finally {
            // Clean up or any final tasks
            await this.cleanupTemporaryTables();
        }

    }

    private async createTemporaryTables(): Promise<void> {
        const createTempTablesQuery = `
            CREATE TEMPORARY TABLE tmp_matched_txns AS
SELECT N.UPI_TXN_ID,N.TXN_DATE,N.AMOUNT,N.PAYER_VPA,N.PAYEE_VPA,S.STATUS,N.UPICODE,N.RRN,
    N.MCC,now() AS RECON_DATE,FALSE AS SETTLEMENT_STATUS,N.TXN_TIME,
    CAST(NULL AS Nullable(Date)) AS SETTLEMENT_DATE
FROM
    NPCI_TXN AS N
INNER JOIN
    SWITCH_TXN AS S
ON
    N.UPI_TXN_ID = S.UPI_TXN_ID;

CREATE TEMPORARY TABLE tmp_nonrecon_txns AS
SELECT
    'SWITCH' AS TX_TYPE, S.UPI_TXN_ID, S.UPICODE, S.STATUS AS TXN_STATUS, S.AMOUNT,
    S.TXN_DATE, S.TXN_TIME, S.RRN, '' AS PAYER_CODE, S.PAYER_VPA,
    '' AS PAYEE_CODE, S.PAYEE_VPA, S.MCC, '' AS REM_IFSC_CODE, '' AS REM_ACC_NUMBER,
    '' AS BEN_IFSC_CODE, '' AS BEN_ACC_NUMBER, TRUE AS IS_SWITCH, FALSE AS IS_NPCI,
    FALSE AS IS_CBS, S.UPI_TXN_ID_HASH, S.UPLOAD_ID
FROM SWITCH_TXN AS S LEFT JOIN NPCI_TXN AS N ON S.UPI_TXN_ID = N.UPI_TXN_ID
WHERE N.UPI_TXN_ID IS NULL
UNION ALL
SELECT 'NPCI' AS TX_TYPE, N.UPI_TXN_ID, N.UPICODE, '' AS TXN_STATUS, N.AMOUNT,
N.TXN_DATE, N.TXN_TIME, N.RRN, N.PAYER_CODE, N.PAYER_VPA,
    N.PAYEE_CODE, N.PAYEE_VPA, N.MCC, N.REM_IFSC_CODE, N.REM_ACC_NUMBER,
    N.BEN_IFSC_CODE, N.BEN_ACC_NUMBER, FALSE AS IS_SWITCH, TRUE AS IS_NPCI,
    FALSE AS IS_CBS, N.UPI_TXN_ID_HASH, toUInt8(N.UPLOAD_ID) AS UPLOAD_ID
FROM
    NPCI_TXN AS N
LEFT JOIN
    SWITCH_TXN AS S
ON
    N.UPI_TXN_ID = S.UPI_TXN_ID
WHERE
    S.UPI_TXN_ID IS NULL;
        `;
        this.logger.log('Creating temporary tables...');
        await this.clickdb.query({ query: createTempTablesQuery });
        this.logger.log('Temporary tables created successfully.');
    }




    private async insertMatchedTransactions(): Promise<void> {
        const countMatchedQuery = 'SELECT COUNT(*) AS count FROM tmp_matched_txns';
        const result = await this.clickdb.query({ query: countMatchedQuery });
        const totalMatched = (await result.json() as any)?.data[0]?.count as number;

        this.logger.log(`Inserting ${totalMatched} matched transactions into TWOWAY_RECON_TXN...`);
        for (let i = 0; i < totalMatched; i += this.BATCH_SIZE) {
            const insertQuery = `
                INSERT INTO TWOWAY_RECON_TXN 
                SELECT * FROM tmp_matched_txns LIMIT ${this.BATCH_SIZE} OFFSET ${i};
            `;
            await this.clickdb.query({ query: insertQuery });
            this.logger.log(`Inserted batch of ${Math.min(this.BATCH_SIZE, totalMatched - i)} matched transactions.`);
        }
    }

    private async insertUnmatchedTransactions(): Promise<void> {
        const countNonReconQuery = 'SELECT COUNT(*) AS count FROM tmp_nonrecon_txns';
        const result = await this.clickdb.query({ query: countNonReconQuery });
        const totalNonRecon = (await result.json() as any)?.data[0]?.count as number;

        this.logger.log(`Inserting ${totalNonRecon} unmatched transactions into NON_RECON_TXN...`);

        for (let i = 0; i < totalNonRecon; i += this.BATCH_SIZE) {
            const insertQuery = `
                INSERT INTO NON_RECON_TXN 
                SELECT * FROM tmp_nonrecon_txns LIMIT ${this.BATCH_SIZE} OFFSET ${i};
            `;
            await this.clickdb.query({ query: insertQuery });
            this.logger.log(`Inserted batch of ${Math.min(this.BATCH_SIZE, totalNonRecon - i)} unmatched transactions.`);
        }
    }

    private async deleteMatchedTransactions(): Promise<void> {
        this.logger.log('Deleting matched transactions from SWITCH_TXN and NPCI_TXN...');

        const deleteSwitchTxnQuery = `
            ALTER TABLE SWITCH_TXN 
            DELETE WHERE UPI_TXN_ID IN (SELECT UPI_TXN_ID FROM tmp_matched_txns);
        `;
        await this.clickdb.query({ query: deleteSwitchTxnQuery });

        const deleteNpcTxnQuery = `
            ALTER TABLE NPCI_TXN 
            DELETE WHERE UPI_TXN_ID IN (SELECT UPI_TXN_ID FROM tmp_matched_txns);
        `;
        await this.clickdb.query({ query: deleteNpcTxnQuery });

        this.logger.log('Matched transactions deleted successfully.');
    }

    private async cleanupTemporaryTables(): Promise<void> {
        // Temporary tables in ClickHouse are automatically deleted at the end of the session,
        // but you can add cleanup logic here if needed.
        this.logger.log('Cleanup of temporary tables completed.');
    }

    private notifyCompletion(): boolean {
        //todo send notification using websocket
        this.logger.log('Sending notification via websocket...');
        //this.websocket.send('Reconciliation process completed successfully');
        return true;
    }

    getFailureCount(date: string) {
        throw new Error('Method not implemented.');
    }
    getReconTXNS(date: string) {

    }
    async getSuccessTXNS(date: string) {

    }
    getFailedTXNS(date: string) {
        throw new Error('Method not implemented.');
    }
    async getSuccessCount(date: string) {
        try {
            const countMatchedQuery = `SELECT COUNT(*) AS count FROM NPCI_TXN WHERE UPICODE IN ['0','00','RB']`;
            const result = await this.clickdb.query({ query: countMatchedQuery });
            //const totalMatched = result.response_headers['x-total-count'];
            const totalMatched = (await result.json() as any)?.data[0]?.count as number;
            console.log('totalMatched', totalMatched)
            return totalMatched;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
    getTotalReconCountByDate(date: string) {
        throw new Error('Method not implemented.');
    }
    getNPCICountByDate(date: string) {
        throw new Error('Method not implemented.');
    }





    async getTotalTXNCountByDate(date: string) {
        const query: QueryParams = {
            query: `SELECT SUM(count)
            FROM (
                SELECT COUNT(*) AS count FROM TWOWAY_RECON
                UNION ALL
                SELECT COUNT(*) AS count FROM SWITCH_TXN
                UNION ALL
                SELECT COUNT(*) AS count FROM NPCI_TXN
            ) AS combined_counts;`
        };

        try {
            const p = await this.clickdb.query(query);
            const data = await p.json();
            return data;
        } catch (error) {
            console.log(error);
            return error;
        }

    }

    getReconReport() {

    }

}
