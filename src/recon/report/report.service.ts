import { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpException, Injectable } from '@nestjs/common';
import { Multer } from 'multer'
@Injectable()
export class ReportService {

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient
    ) { }



    async getMissingTXNS(queryDate: Date) {
        try {
            const date = new Date(queryDate);
            const query = await this.clickdb.query({ query: `SELECT * FROM MISSING_TXN WHERE TXN_DATE='${date}'` });
            return await query.json();

        } catch (error) {
            console.error(error)
            return error;
        }
    }

    async getSwitchTXN(startDate: string, endDate: string, startPosition: number, offset: number) {
        try {
            const query = `SELECT * FROM SWITCH_TXN WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${offset} OFFSET ${startPosition}`;
            const res = await this.clickdb.query({ query });
            const data = await res.json();
            return data.data;

        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error('Error fetching transactions');
        }
    }

    async getReconTXN(startDate: string, endDate: string, startPosition: number, offset: number) {
        try {
            console.log(startDate, endDate, startPosition, offset);
            const query = `SELECT * FROM TWOWAY_RECON_TXN WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${offset} OFFSET ${startPosition}`;
            const res = await this.clickdb.query({ query });
            const data = await res.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error('Error fetching transactions');
        }
    }

    async getReconCountByDate(startDate: string, endDate: string) {
        try {
            const query = `SELECT COUNT(*) AS COUNT, SUM (AMOUNT) AS AMOUNT FROM TWOWAY_RECON_TXN WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}'`;
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


    async getInvalidTXN(startDate: string, endDate: string, startPosition: number, offset: number) {
        try {
            const query = `SELECT * FROM INVALID_TXN WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${offset} OFFSET ${startPosition}`;
            const res = await this.clickdb.query({ query });
            const data = await res.json();
            return data.data;

        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error('Error fetching transactions');
        }
    }


    async getDuplicateTXN(startDate: string, endDate: string, startPosition: number, offset: number) {
        try {
            const query = `SELECT * FROM DUPLICATE_TXN WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${offset} OFFSET ${startPosition}`;
            const res = await this.clickdb.query({ query });
            const data = await res.json();
            return data.data;

        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw new Error('Error fetching transactions');
        }
    }



}
