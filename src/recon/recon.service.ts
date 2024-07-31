import { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpException, Injectable } from '@nestjs/common';
import { Multer } from 'multer'
import { FileValidationService } from './file-upload/file-validation.service';
@Injectable()
export class ReconService {
    getFailureCount(date: string) {
        throw new Error('Method not implemented.');
    }
    getReconTXNS(date: string) {
        throw new Error('Method not implemented.');
    }
    getSuccessTXNS(date: string) {
        throw new Error('Method not implemented.');
    }
    getFailedTXNS(date: string) {
        throw new Error('Method not implemented.');
    }
    getSuccessCount(date: string) {
        throw new Error('Method not implemented.');
    }
    getTotalReconCountByDate(date: string) {
        throw new Error('Method not implemented.');
    }
    getNPCICountByDate(date: string) {
        throw new Error('Method not implemented.');
    }
    getSwitchCountByDate(date: string) {
        throw new Error('Method not implemented.');
    }

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient, private validator: FileValidationService
    ) { }

    async initiate2WayRecon(date: string) {
        //initiate recon 
        console.log(`2 way recon initiated for ${date}`);
        const startTime = performance.now();
        const reconDate = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
        try {
            const command = await this.clickdb.query({
                query: `INSERT INTO TWOWAY_RECON_TXN (UPI_TXN_ID, TXN_DATE, TXN_TIME, AMOUNT, PAYER_VPA, PAYEE_VPA, TXN_STATUS, UPICODE, RRN, MCC)
                SELECT
                S.UPI_TXN_ID,
                S.TXN_DATE,
                S.TXN_TIME,
                S.AMOUNT,
                S.PAYER_VPA,
                S.PAYEE_VPA,
                S.STATUS,
                T.UPICODE,
                T.RRN,
                T.MCC,
                FROM NPCI_TXN AS T
                INNER JOIN SWITCH_TXN AS S
                ON T.UPI_TXN_ID = S.UPI_TXN_ID
                WHERE DATEDIFF(day, S.TXN_DATE, T.TXN_DATE) BETWEEN -1 AND 1
                ORDER BY
                T.TXN_TIME ASC
                ;`
            });

            //once all recon is completed delete the reconciled transaction from NPCI and SWITCH table;

            console.log(command.query_id);
            // await this.removeDuplicates();
            const endTime = performance.now();
            return `2 way recon completed successfully in ${endTime - startTime} ms`;
        } catch (error) {
            console.log(error);
            return error;
        } finally {
            console.log("2 way recon completed successfully");
        }
    }

    async performInnerJoin() {
        // Logic to perform inner join on Txn id and UPI Txn id
        const query: QueryParams = {
            query: `SELECT S.UPI_TXN_ID, S.TXN_DATE, S.TXN_TIME, S.UPICODE, 
            S.RRN, S.PAYER_VPA, S.PAYEE_VPA, S.AMOUNT, S.MCC, T.STATUS,
            T.NOTE FROM NPCI_TXN AS S INNER JOIN SWITCH_TXN AS T
            ON S.UPI_TXN_ID = T.UPI_TXN_ID
            WHERE DATEDIFF(day, S.TXN_DATE, T.TXN_DATE) BETWEEN -1 AND 1;`
        };
        const p = await this.clickdb.query(query);
        const data = await p.json();
        return data;
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
            ) AS combined_counts;';`
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


}
