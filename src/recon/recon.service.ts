import { ClickHouseClient } from "@clickhouse/client";
import { InjectClickHouse } from "@md03/nestjs-clickhouse";
import { Injectable } from "@nestjs/common";
import { CustomLogger } from "src/custom-logger";

@Injectable()
export class ReconService {

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient,
        private readonly logger: CustomLogger,
    ) {

    }

    async initiateTwoWayRecon() {
        console.log('Starting reconciliation process...');
        try {
            await this.insertIntoRecon();
            this.logger.log('Reconciliation records processed successfully.');
            await this.insertIntoNonRecon();
            this.logger.log('Non-reconciliation records processed successfully.');
            await this.performCleanup('SWITCH_TXN');
            await this.performCleanup('NPCI_TXN');
            this.logger.log('Reconciliation process completed successfully.');
            await this.notifyCompletion();
        } catch (error) {
            console.error('Error during reconciliation process', error.stack);
            return 'Reconciliation process failed';
        }
    }


    async insertIntoRecon() {
        this.logger.log('Inserting into RECON_TXN...');
        const reconQuery = `INSERT INTO RECON_TXN
            (TX_TYPE, UPI_TXN_ID, UPICODE, TXN_STATUS, AMOUNT, TXN_DATE, TXN_TIME, RRN,
            PAYER_CODE, PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER,
            BEN_IFSC_CODE, BEN_ACC_NUMBER, NOTE)
            SELECT N.TX_TYPE, N.UPI_TXN_ID, N.UPICODE, S.STATUS, N.AMOUNT, N.TXN_DATE, N.TXN_TIME, N.RRN,
            N.PAYER_CODE, N.PAYER_VPA, N.PAYEE_CODE, N.PAYEE_VPA, N.MCC, N.REM_IFSC_CODE, N.REM_ACC_NUMBER,
            N.BEN_IFSC_CODE, N.BEN_ACC_NUMBER, S.NOTE
            FROM NPCI_TXN AS N INNER JOIN SWITCH_TXN AS S
            ON N.UPI_TXN_ID = S.UPI_TXN_ID
            WHERE N.UPICODE IN ('0', '00', 'RB');`;
        return await this.executeQuery(reconQuery);
    }

    async insertIntoNonRecon() {
        this.logger.log('Inserting into NON_RECON_TXN...');
        //FIRST INSERT ALL MATCHED TRANSACTION BUT WITH FAILED STATUS 
        const failedQuery = `INSERT INTO NON_RECON_TXN
            (TX_TYPE, UPI_TXN_ID, UPICODE, TXN_STATUS, AMOUNT, TXN_DATE, TXN_TIME, RRN,
            PAYER_CODE, PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER,
            BEN_IFSC_CODE, BEN_ACC_NUMBER, NOTE, IS_SWITCH, IS_NPCI, IS_CBS, UPLOAD_ID)
            SELECT N.TX_TYPE, N.UPI_TXN_ID, N.UPICODE, S.STATUS, N.AMOUNT, N.TXN_DATE, N.TXN_TIME, N.RRN, 
            N.PAYER_CODE, N.PAYER_VPA, N.PAYEE_CODE, N.PAYEE_VPA, N.MCC, N.REM_IFSC_CODE, N.REM_ACC_NUMBER, 
            N.BEN_IFSC_CODE, N.BEN_ACC_NUMBER, S.NOTE, TRUE AS IS_SWITCH, TRUE AS IS_NPCI, FALSE AS IS_CBS, 
            'MATCHED' AS UPLOAD_ID 
            FROM NPCI_TXN AS N INNER JOIN SWITCH_TXN AS S 
            ON N.UPI_TXN_ID = S.UPI_TXN_ID 
            WHERE N.UPICODE NOT IN ('0', '00', 'RB')`
        await this.executeQuery(failedQuery);
        //STEP 2: INSERT ALL NON-MATCHED RECORDS
        const nonReconQuery = `INSERT INTO NON_RECON_TXN
            (TX_TYPE, UPI_TXN_ID, UPICODE, TXN_STATUS, AMOUNT, TXN_DATE, TXN_TIME, RRN, PAYER_CODE,
            PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER, BEN_IFSC_CODE,
            BEN_ACC_NUMBER, NOTE, IS_SWITCH, IS_NPCI, IS_CBS, UPLOAD_ID)
            
            SELECT N.TX_TYPE, N.UPI_TXN_ID, N.UPICODE, 'UNKNOWN' AS TXN_STATUS,
            N.AMOUNT, N.TXN_DATE, N.TXN_TIME, N.RRN, N.PAYER_CODE, N.PAYER_VPA, N.PAYEE_CODE,
            N.PAYEE_VPA, N.MCC, N.REM_IFSC_CODE, N.REM_ACC_NUMBER, N.BEN_IFSC_CODE, N.BEN_ACC_NUMBER,  FALSE AS IS_SWITCH, TRUE AS IS_NPCI, FALSE AS IS_CBS, N.UPLOAD_ID
            FROM NPCI_TXN AS N
            LEFT JOIN SWITCH_TXN AS S
            ON N.UPI_TXN_ID = S.UPI_TXN_ID
            WHERE S.UPI_TXN_ID IS NULL UNION ALL
            SELECT 'SWITCH' AS TX_TYPE, S.UPI_TXN_ID, NULL AS UPICODE, S.STATUS AS TXN_STATUS,
            NULL AS AMOUNT, NULL AS TXN_DATE, NULL AS TXN_TIME, NULL AS RRN, NULL AS PAYER_CODE,
            NULL AS PAYER_VPA, NULL AS PAYEE_CODE, NULL AS PAYEE_VPA, NULL AS MCC, NULL AS REM_IFSC_CODE,
            NULL AS REM_ACC_NUMBER, NULL AS BEN_IFSC_CODE, NULL AS BEN_ACC_NUMBER, S.NOTE,
            TRUE AS IS_SWITCH, FALSE AS IS_NPCI, FALSE AS IS_CBS, S.UPLOAD_ID
            FROM SWITCH_TXN AS S
            LEFT JOIN NPCI_TXN AS N
            ON S.UPI_TXN_ID = N.UPI_TXN_ID
            WHERE N.UPI_TXN_ID IS NULL;`
    }


    async executeQuery(query: string) {
        let attempt = 0;
        const maxAttempts = 6;
        const initialDelay = 2000;
        while (attempt < maxAttempts) {
            try {
                await this.clickdb.exec({ query: query });
                return; // Exit method if successful
            } catch (error) {
                attempt++;
                const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
                this.logger.error(`Attempt ${attempt} failed. Error: ${error.message}`, error);

                if (attempt < maxAttempts) {
                    this.logger.log(`Retrying in ${delay} ms...`);
                    await this.delay(delay); // Wait before retrying
                } else {
                    this.logger.error(`All ${maxAttempts} attempts failed. query ${query} could not be executed.`, error);
                    throw error; // Re-throw error if all attempts fail
                }
            }
        }
    }
    async performCleanup(tableName: string) {
        let attempt = 0;
        const maxAttempts = 6;
        const initialDelay = 2000;

        while (attempt < maxAttempts) {
            try {
                this.logger.log(`Truncating table ${tableName}...`);
                await this.clickdb.exec({ query: `TRUNCATE TABLE ${tableName};` });
                this.logger.log(`Table ${tableName} truncated successfully.`);
                return; // Exit method if successful
            } catch (error) {
                attempt++;
                const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
                this.logger.error(`Attempt ${attempt} failed. Error: ${error.message}`, error);

                if (attempt < maxAttempts) {
                    this.logger.log(`Retrying in ${delay} ms...`);
                    await this.delay(delay); // Wait before retrying
                } else {
                    this.logger.error(`All ${maxAttempts} attempts failed. ${tableName} could not be truncated.`, error);
                    throw error; // Re-throw error if all attempts fail
                }
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async notifyCompletion() {

    }
}