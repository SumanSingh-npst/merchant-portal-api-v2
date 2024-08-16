import { HttpException, HttpStatus, Injectable, LoggerService } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { CustomLogger } from 'src/custom-logger';

@Injectable()
export class ReconService {

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient,
        private readonly logger: CustomLogger,
    ) { }

    async initiate2WayRecon(): Promise<any> {
        this.logger.log('Starting reconciliation process...');
        try {
            await this.performRecon();
            this.logger.log('Reconciliation process completed successfully.');
            this.notifyCompletion();
        } catch (error) {
            this.logger.error('Error during reconciliation process', error.stack);
            return new HttpException('Reconciliation process failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private async performRecon(): Promise<void> {
        const maxRetries = 10;
        const retryDelay = 1000; // Initial delay in milliseconds

        const executeWithRetry = async (fn: () => Promise<any>, retries: number = maxRetries, delay: number = retryDelay): Promise<void> => {
            try {
                await fn();
            } catch (error) {
                if (retries <= 0) {
                    throw error; // Rethrow the error if no retries left
                }
                this.logger.error(`Error: ${error.message}. Retrying in ${delay}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, delay));
                await executeWithRetry(fn, retries - 1, delay * 1); // Exponential backoff
            }
        };

        try {
            const matchedData = await this.getMatchingRecords(executeWithRetry);

            if (matchedData.length > 0) {
                this.logger.log(`Found ${matchedData.length} matching transactions. Moving to TWOWAY_RECON_TXN...`);
                await this.insertIntoTwoWayRecon(matchedData, executeWithRetry, maxRetries, retryDelay);
                await this.deleteFromTables(matchedData, executeWithRetry, maxRetries, retryDelay);
            } else {
                this.logger.log('No matching transactions found.');
                return;
            }
        } catch (error) {
            this.logger.error('Error during performRecon', error.stack);
            throw new Error('Reconciliation process failed during transaction matching');
        }
    }

    private async getMatchingRecords(executeWithRetry: Function): Promise<any[]> {
        const matchingRecordsQuery = `
        SELECT 
          N.UPI_TXN_ID, N.TXN_DATE, N.TXN_TIME, N.AMOUNT, N.PAYER_VPA, N.PAYEE_VPA, 
          S.STATUS, N.UPICODE, N.RRN, N.MCC, now() AS RECON_DATE, 
          FALSE AS SETTLEMENT_STATUS, S.UPLOAD_ID AS UPLOAD_ID 
        FROM 
          NPCI_TXN AS N 
        INNER JOIN 
          SWITCH_TXN AS S 
        ON 
          N.UPI_TXN_ID = S.UPI_TXN_ID
        WHERE N.UPICODE IN ('0', '00', 'RB');
    `;

        //        const matchingRecordsResponse = await executeWithRetry(() => this.clickdb.query({ query: matchingRecordsQuery }));
        const matchingRecordsResponse = await this.clickdb.query({ query: matchingRecordsQuery });

        console.log(matchingRecordsResponse);
        if (matchingRecordsResponse && typeof matchingRecordsResponse.json === 'function') {
            const matchingRecordsJson = await matchingRecordsResponse.json();
            return matchingRecordsJson.data || [];
        } else {
            // Handle the case where the response does not have a json method
            throw new Error('Unexpected response format from query execution');
        }
    }

    private async insertIntoTwoWayRecon(matchedData: any[], executeWithRetry: Function, maxRetries: number, retryDelay: number): Promise<void> {
        const batchSize = 50000;
        const matchLength = matchedData.length;
        for (let i = 0; i < matchLength; i += batchSize) {
            const batch = matchedData.slice(i, i + batchSize);
            const values = batch.map(row => `(
            '${row.UPI_TXN_ID}', '${row.TXN_DATE}', '${row.TXN_TIME}', ${row.AMOUNT}, 
            '${row.PAYER_VPA}', '${row.PAYEE_VPA}', '${row.STATUS}', '${row.UPICODE}', 
            '${row.RRN}', '${row.MCC}', '${row.RECON_DATE}', ${row.SETTLEMENT_STATUS}, 
            '${row.UPLOAD_ID}'
        )`).join(', ');

            const insertQuery = `
            INSERT INTO TWOWAY_RECON_TXN 
            (UPI_TXN_ID, TXN_DATE, TXN_TIME, AMOUNT, PAYER_VPA, PAYEE_VPA, TXN_STATUS, UPICODE, RRN, MCC, RECON_DATE, SETTLEMENT_STATUS, UPLOAD_ID)
            VALUES ${values};
        `;

            console.log(`inserting ${batch.length} rows of ${matchLength} records into TWO_WAY_RECON...`);
            await executeWithRetry(() => this.clickdb.exec({ query: insertQuery }), maxRetries, retryDelay);
        }
        this.logger.log('Matched transactions moved to TWOWAY_RECON_TXN successfully.');
    }

    private async deleteFromTables(matchedData: any[], executeWithRetry: Function, maxRetries: number, retryDelay: number): Promise<void> {
        const deleteBatchSize = 1000;
        for (let i = 0; i < matchedData.length; i += deleteBatchSize) {
            const batch = matchedData.slice(i, i + deleteBatchSize);
            const upiTxnIds = batch.map(row => `'${row.UPI_TXN_ID}'`).join(', ');

            const deleteSwitchTxnQuery = `
            ALTER TABLE SWITCH_TXN 
            DELETE WHERE UPI_TXN_ID IN (${upiTxnIds});
        `;
            console.log(`deleting ${batch.length} rows of ${matchedData.length} records from SWITCH_TXN...`);

            await executeWithRetry(() => this.clickdb.query({ query: deleteSwitchTxnQuery }), maxRetries, retryDelay);
            console.log(`deleted SWITCH_TXN successfully`);
            const deleteNpcTxnQuery = `
            ALTER TABLE NPCI_TXN 
            DELETE WHERE UPI_TXN_ID IN (${upiTxnIds});
        `;
            console.log(`deleting ${batch.length} rows of ${matchedData.length} records from NPCI_TXN...`);
            await executeWithRetry(() => this.clickdb.query({ query: deleteNpcTxnQuery }), maxRetries, retryDelay);
        }
        this.logger.log('deletion activities completed successfully.');
    }

    private notifyCompletion(): void {
        this.logger.log('Sending notification of reconciliation completion...');
        // Add notification logic here (e.g., WebSocket, email)
    }
}
