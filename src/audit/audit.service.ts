import { Injectable } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';

@Injectable()
export class AuditService {
    constructor(@InjectClickHouse() private readonly clickhouse: ClickHouseClient) { }

    async logEvent(userId: string, eventType: string, ipAddress: string, details: string, requestBody: any) {
        const query = `INSERT INTO AUDIT_LOGS (USER_ID, EVENT_TIME, EVENT_TYPE, IP_ADDRESS, DETAILS, REQUEST_BODY) 
        VALUES ('${userId}','${new Date().toISOString()}', '${eventType}', '${ipAddress}', '${details}', '${requestBody}');`;
        console.log(query);
        return await this.clickhouse.command({ query: query });
    }

    async getAuditLogs(startDate: string, endDate: string) {
        const res = await this.clickhouse.query({
            query: `SELECT * FROM AUDIT_LOGS WHERE EVENT_TIME BETWEEN '${startDate}' AND '${endDate}' ORDER BY EVENT_TIME DESC;`,
        });
        return (await res.json()).data;
    }
}
