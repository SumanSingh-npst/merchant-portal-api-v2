import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { Injectable } from '@nestjs/common';
import { ZipService } from './zip.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectClickHouse() private readonly clickdb: ClickHouseClient,
    private readonly zipService: ZipService,
  ) {}

  async getAllTXN(
    startDate: string,
    endDate: string,
    startPosition: number,
    offset: number,
    txnType: string,
    UPI_TXN_ID?: string,
    RRN?: string,
    UPICODE?: string,
  ) {
    try {
      let query = `SELECT * FROM ${txnType}`;
      const conditions = [];

      if (UPI_TXN_ID) {
        conditions.push(`UPI_TXN_ID = '${UPI_TXN_ID}'`);
      }

      if (RRN) {
        conditions.push(`RRN = '${RRN}'`);
      }

      if (UPICODE) {
        conditions.push(`UPICODE = '${UPICODE}'`);
      }

      //   const query = `SELECT * FROM ${txnType} WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${offset} OFFSET ${startPosition}`;
      console.log(`query= ${query}`);
      const res = await this.clickdb.query({ query });
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching npci transactions:', error);
      throw new Error('Error fetching npci transactions' + error);
    }
  }

  async getAllCount(startDate: string, endDate: string, tableName: string) {
    try {
      const query = `SELECT COUNT(*) AS COUNT,  SUM(IFNULL(toFloat64(AMOUNT), 0)) AS AMOUNT FROM ${tableName} WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}'`;
      const res = await this.clickdb.query({ query });
      const data: any = (await res.json()).data[0]; // Extract the first (and only) object from the array
      return {
        count: parseInt(data.COUNT, 10),
        amount: parseFloat(parseFloat(data.AMOUNT).toFixed(2)),
      };
    } catch (error) {
      console.error('Error fetching transactions count and volume:', error);
      throw new Error('Error fetching transactions count and volume');
    }
  }

  async getAllSuccessCount(
    startDate: string,
    endDate: string,
    tableName: string,
  ) {
    try {
      const query = `SELECT COUNT(*) AS COUNT,  SUM(IFNULL(toFloat64(AMOUNT), 0)) AS AMOUNT FROM ${tableName} WHERE UPICODE IN ('0', '00', 'RB') AND TXN_DATE BETWEEN '${startDate}' AND '${endDate}'`;
      const res = await this.clickdb.query({ query });
      const data: any = (await res.json()).data[0]; // Extract the first (and only) object from the array
      return {
        count: parseInt(data.COUNT, 10),
        amount: parseFloat(parseFloat(data.AMOUNT).toFixed(2)),
      };
    } catch (error) {
      console.error(
        'Error fetching success transactions count and volume:',
        error,
      );
      throw new Error('Error fetching success transactions count and volume');
    }
  }

  async getAllFailureCount(
    startDate: string,
    endDate: string,
    tableName: string,
  ) {
    try {
      const query = `SELECT COUNT(*) AS COUNT,  SUM(IFNULL(toFloat64(AMOUNT), 0)) AS AMOUNT FROM ${tableName} WHERE UPICODE NOT IN ('0','00','RB') AND TXN_DATE BETWEEN '${startDate}' AND '${endDate}'`;
      const res = await this.clickdb.query({ query });
      const data: any = (await res.json()).data[0]; // Extract the first (and only) object from the array
      return {
        count: parseInt(data.COUNT, 10),
        amount: parseFloat(parseFloat(data.AMOUNT).toFixed(2)),
      };
    } catch (error) {
      console.error(
        'Error fetching failure transactions count and volume:',
        error,
      );
      throw new Error('Error fetching failure transactions count and volume');
    }
  }

  async getAllTXNCount(startDate: string, endDate: string, txnType: string) {
    const query = `SELECT COUNT(*) AS COUNT FROM ${txnType} WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}'`;
    const res = await this.clickdb.query({ query });
    const data = await res.json();
    const totalRecords = parseInt((data as any).data[0].COUNT, 10);
    return totalRecords;
  }

  async processChunks(
    startDate: string,
    endDate: string,
    txnType: string,
    chunkSize: number,
    totalRecords: number,
  ) {
    const totalChunks = Math.ceil(totalRecords / chunkSize);
    console.log('starting chunk processing...');
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const data = await this.clickdb.query({
        query: `SELECT * FROM ${txnType} WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${chunkSize} OFFSET ${start}`,
        format: 'CSV',
      });
      const buffer = Buffer.from((await data.text()).toString());
      this.zipService.addToZip(buffer, `chunk_${i}.csv`);
      console.log(`Processed chunk ${i + 1} of ${totalChunks}`);
    }
  }
}
