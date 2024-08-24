import { ClickHouseClient } from "@clickhouse/client";
import { InjectClickHouse } from "@md03/nestjs-clickhouse";
import { Injectable } from "@nestjs/common";
import { CustomSettingService } from "src/custom-setting/custom-setting.service";


@Injectable()
export class QueueService {
    constructor(private settingSvc: CustomSettingService, @InjectClickHouse() private readonly clickdb: ClickHouseClient,
    ) {

    }

    async enqueueDownloadRequest(tableName: string, uuid: string, startDate: string, endDate: string, userId: string): Promise<void> {
        const requestDate = new Date().toISOString();
        const status = 'PENDING';
        try {
            const insertQuery = `INSERT INTO DOWNLOAD_QUEUE (QUEUE_ID, USER_ID, REQUEST_DATE, RANGE_START, RANGE_END, STATUS, TABLE_NAME)
      VALUES ('${uuid}','${userId}', '${requestDate}', '${startDate}', '${endDate}', '${status}', '${tableName}')`;
            console.log(insertQuery);
            await this.clickdb.exec({ query: insertQuery });
            return;
        } catch (error) {
            console.log('got error inserting into DOWNLOAD_QUEUE', error);
            return error;
            //throw new Error(`error while inserting into DOWNLOAD_QUEUE table. the error is ${error}`,);
        }
    }

    async checkQueueExists(tableName: string, senderId: string, startDate: string, endDate: string): Promise<boolean> {
        const query = `SELECT USER_ID, RANGE_START, RANGE_END, STATUS FROM DOWNLOAD_QUEUE WHERE USER_ID='${senderId}'AND TABLE_NAME = '${tableName}' AND RANGE_START='${startDate}' AND RANGE_END='${endDate}' AND STATUS = 'PENDING' LIMIT 1;`;
        const result = await this.clickdb.query({ query });
        const jsonResponse = await result.json();
        if ((jsonResponse as any).data.length > 0) {
            return true;
        }
        return false;
    }

    async updateQueue(queueId: number, chunkSize: number, downloadCount: number, status: string, downloadUrl: string = ''): Promise<void> {
        const updateQuery = `
      ALTER TABLE DOWNLOAD_QUEUE UPDATE CHUNK_SIZE = ${chunkSize}, 
      DOWNLOAD_COUNT = ${downloadCount}, STATUS = '${status}'
      WHERE QUEUE_ID = '${queueId}';
    `;

        const endQuery = `
      ALTER TABLE DOWNLOAD_QUEUE UPDATE STATUS = '${status}', DOWNLOAD_URL = '${downloadUrl}', END_TIME = '${new Date().toISOString()}'
      WHERE QUEUE_ID = '${queueId}';
    `;
        console.log(updateQuery);
        try {
            downloadUrl.length === 0 ? await this.clickdb.query({ query: updateQuery }) : await this.clickdb.query({ query: endQuery });
            return;
        } catch (error) {
            console.log('got error updating DOWNLOAD_QUEUE', error);
            return error;
        }
    }

    async getZipFile(queueId: string, userId: string) {
        const query = `SELECT DOWNLOAD_URL as download_url FROM DOWNLOAD_QUEUE WHERE QUEUE_ID='${queueId}' AND USER_ID = '${userId}'`;
        const result = await this.clickdb.query({ query });
        const jsonResponse = await result.json();
        if ((jsonResponse as any).data.length > 0) {
            return (jsonResponse as any).data[0].download_url;
        } else {
            return null;
        }
    }

}