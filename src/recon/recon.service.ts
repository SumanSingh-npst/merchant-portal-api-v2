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
            this.logger.log('cleanup activities process completed successfully.');

            await this.notifyCompletion();
            this.logger.log('Reconciliation process completed successfully.');
            return { status: true, msg: 'Reconciliation process completed successfully' };
        } catch (error) {
            this.logger.error('Error during reconciliation process', error);
            return { status: false, msg: 'Reconciliation process failed', error: error }
        }
    }


    async insertIntoRecon() {
        const reconQuery = `INSERT INTO RECON_TXN
            (TX_TYPE, UPI_TXN_ID, UPICODE, TXN_STATUS, AMOUNT, TXN_DATE, TXN_TIME, RRN,
            PAYER_CODE, PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER,
            BEN_IFSC_CODE, BEN_ACC_NUMBER, NOTE)
            SELECT DISTINCT N.TX_TYPE, N.UPI_TXN_ID, N.UPICODE, S.STATUS, N.AMOUNT, N.TXN_DATE, N.TXN_TIME, N.RRN,
            N.PAYER_CODE, N.PAYER_VPA, N.PAYEE_CODE, N.PAYEE_VPA, N.MCC, N.REM_IFSC_CODE, N.REM_ACC_NUMBER,
            N.BEN_IFSC_CODE, N.BEN_ACC_NUMBER, S.NOTE
            FROM NPCI_TXN AS N INNER JOIN SWITCH_TXN AS S
            ON N.UPI_TXN_ID = S.UPI_TXN_ID`;
        try {
            this.logger.log('Inserting into RECON_TXN...');
            const result = await this.executeQuery(reconQuery);
            return result;
        } catch (error) {
            throw new Error("Error inserting into RECON_TXN: " + error.stack);

        }

    }

    async insertIntoNonRecon() {
        this.logger.log('Inserting into NON_RECON_TXN...');

        const nonMatchingRecordsQuery = `
        INSERT INTO NON_RECON_TXN (AMOUNT, BEN_ACC_NUMBER, BEN_IFSC_CODE, MCC, PAYEE_CODE,
        PAYEE_VPA, PAYER_CODE, PAYER_VPA, REM_ACC_NUMBER, REM_IFSC_CODE, RRN, TXN_DATE,
            TXN_TIME, TX_TYPE, UPICODE, UPI_TXN_ID, UPLOAD_ID,
            IS_SWITCH, IS_NPCI, IS_CBS)
        SELECT AMOUNT, BEN_ACC_NUMBER, BEN_IFSC_CODE, MCC, PAYEE_CODE, PAYEE_VPA,
            PAYER_CODE, PAYER_VPA, REM_ACC_NUMBER, REM_IFSC_CODE, RRN, TXN_DATE, 
            TXN_TIME, TX_TYPE, UPICODE, UPI_TXN_ID, UPLOAD_ID, 
            FALSE AS IS_SWITCH, TRUE AS IS_NPCI, FALSE AS IS_CBS 
            FROM NPCI_TXN WHERE UPI_TXN_ID NOT IN (SELECT UPI_TXN_ID FROM SWITCH_TXN) 
            UNION ALL 
            SELECT AMOUNT, '' AS BEN_ACC_NUMBER, '' AS BEN_IFSC_CODE, MCC, '' AS PAYEE_CODE,
            PAYEE_VPA, '' AS PAYER_CODE, PAYER_VPA, '' AS REM_ACC_NUMBER, '' AS REM_IFSC_CODE, 
            RRN, TXN_DATE, TXN_TIME, '' AS TX_TYPE, UPICODE, UPI_TXN_ID, UPLOAD_ID, 
            TRUE AS IS_SWITCH, FALSE AS IS_NPCI, FALSE AS IS_CBS 
            FROM SWITCH_TXN WHERE UPI_TXN_ID NOT IN (SELECT UPI_TXN_ID FROM NPCI_TXN)`
        try {
            return await this.executeQuery(nonMatchingRecordsQuery);
        } catch (error) {
            this.logger.error(`Error inserting into NON_RECON_TXN`, error);
            throw error;
        }
    }

    async moveFailedTXNtoNonRecon() {
        this.logger.log('Moving failed transactions to NON_RECON_TXN...');
        const query = `INSERT INTO NON_RECON_TXN
            (TX_TYPE, UPI_TXN_ID, UPICODE, TXN_STATUS, AMOUNT, TXN_DATE, TXN_TIME, RRN,
            PAYER_CODE, PAYER_VPA, PAYEE_CODE, PAYEE_VPA, MCC, REM_IFSC_CODE, REM_ACC_NUMBER,
            BEN_IFSC_CODE, BEN_ACC_NUMBER, NOTE, IS_SWITCH, IS_NPCI, IS_CBS)
            SELECT DISTINCT N.TX_TYPE, N.UPI_TXN_ID, N.UPICODE, S.STATUS, N.AMOUNT, N.TXN_DATE, N.TXN_TIME, N.RRN,
            N.PAYER_CODE, N.PAYER_VPA, N.PAYEE_CODE, N.PAYEE_VPA, N.MCC, N.REM_IFSC_CODE, N.REM_ACC_NUMBER,
            N.BEN_IFSC_CODE, N.BEN_ACC_NUMBER, S.NOTE, TRUE AS IS_SWITCH, TRUE AS IS_NPCI, FALSE AS IS_CBS
            FROM NPCI_TXN AS N INNER JOIN SWITCH_TXN AS S
            ON N.UPI_TXN_ID = S.UPI_TXN_ID
            WHERE N.UPICODE NOT IN ('0', '00', 'RB')`;
    }
    async executeQuery(query: string): Promise<number> {
        let attempt = 0;
        const maxAttempts = 6;
        const initialDelay = 2000;
        while (attempt < maxAttempts) {
            try {
                const res = await this.clickdb.exec({ query: query });
                console.log('summary=>', res.summary, 'response header=>', res.response_headers);
                return 0; // Exit method if successful
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
        this.logger.log('Reconciliation process completed successfully');
    }
}