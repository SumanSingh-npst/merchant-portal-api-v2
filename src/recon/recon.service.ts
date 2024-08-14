import { Injectable, LoggerService } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { CustomLogger } from 'src/custom-logger';

@Injectable()
export class ReconService {

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient,
        private readonly logger: CustomLogger,
    ) { }

    async initiate2WayRecon(): Promise<void> {
        this.logger.log('Starting reconciliation process...');
        try {
            await this.performRecon();
            this.logger.log('Reconciliation process completed successfully.');
            this.notifyCompletion();
        } catch (error) {
            this.logger.error('Error during reconciliation process', error.stack);
            throw new Error('Reconciliation process failed');
        }
    }

    private async performRecon(): Promise<void> {
        try {
            // Step 1: Read matching records
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
          WHERE N.UPICODE IN ('0','00','RB');
      `;

            const matchingRecords = await this.clickdb.query({ query: matchingRecordsQuery });
            const matchedData: any[] = (await matchingRecords.json()).data;
            console.log(matchedData);

            if (matchedData.length > 0) {
                this.logger.log(`Found ${matchedData.length} matching transactions. Moving to TWOWAY_RECON_TXN...`);

                // Step 2: Move matching records to TWOWAY_RECON_TXN
                const values = matchedData.map(row => `(
                '${row.UPI_TXN_ID}', '${row.TXN_DATE}', '${row.TXN_TIME}', ${row.AMOUNT}, 
                '${row.PAYER_VPA}', '${row.PAYEE_VPA}', '${row.STATUS}', '${row.UPICODE}', 
                '${row.RRN}', '${row.MCC}', '${row.RECON_DATE}', ${row.SETTLEMENT_STATUS}, 
                 '${row.UPLOAD_ID}'
            )`).join(', ');

                const query = `
                INSERT INTO TWOWAY_RECON_TXN 
                (UPI_TXN_ID, TXN_DATE, TXN_TIME, AMOUNT, PAYER_VPA, PAYEE_VPA, TXN_STATUS, UPICODE, RRN, MCC, RECON_DATE, SETTLEMENT_STATUS, UPLOAD_ID)
                VALUES
            `;
                await this.clickdb.exec({ query: `${query} ${values}` });
                this.logger.log('Matched transactions moved to TWOWAY_RECON_TXN successfully.');
                // Step 3: Delete matched records from SWITCH_TXN and NPCI_TXN
                const upiTxnIds = matchedData.map(row => `'${row.UPI_TXN_ID}'`).join(', ');
                const deleteSwitchTxnQuery = `
          ALTER TABLE SWITCH_TXN 
          DELETE WHERE UPI_TXN_ID IN (${upiTxnIds});
        `;
                await this.clickdb.query({ query: deleteSwitchTxnQuery });

                const deleteNpcTxnQuery = `
          ALTER TABLE NPCI_TXN 
          DELETE WHERE UPI_TXN_ID IN (${upiTxnIds});
        `;
                await this.clickdb.query({ query: deleteNpcTxnQuery });

                this.logger.log('Matched transactions deleted from SWITCH_TXN and NPCI_TXN successfully.');
            } else {
                this.logger.log('No matching transactions found.');
            }
        } catch (error) {
            this.logger.error('Error during performRecon', error.stack);
            throw new Error('Reconciliation process failed during transaction matching');
        }
    }

    private notifyCompletion(): void {
        this.logger.log('Sending notification of reconciliation completion...');
        // Add notification logic here (e.g., WebSocket, email)
    }
}
