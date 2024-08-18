import { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpException, Injectable } from '@nestjs/common';
import { Multer } from 'multer'
@Injectable()
export class ReportService {

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient
    ) { }



    async getAllTXN(startDate: string, endDate: string, startPosition: number, offset: number, txnType: string) {
        try {

            const query = `SELECT * FROM ${txnType} WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${offset} OFFSET ${startPosition}`;
            console.log(`query= ${query}`);
            const res = await this.clickdb.query({ query });
            const data = await res.json();
            return data.data;

        } catch (error) {
            console.error('Error fetching npci transactions:', error);
            throw new Error('Error fetching npci transactions' + error);
        }

    }


    async getReconCountByDate(startDate: string, endDate: string) {
        try {
            const query = `SELECT COUNT(*) AS COUNT, SUM (AMOUNT) AS AMOUNT FROM RECON_TXN WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}'`;
            const res = await this.clickdb.query({ query });
            const data: any = (await res.json()).data[0]; // Extract the first (and only) object from the array

            return {
                count: parseInt(data.COUNT, 10),
                amount: parseFloat(parseFloat(data.AMOUNT).toFixed(2))
            };

        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error('Error fetching transactions');
        }
    }



}
