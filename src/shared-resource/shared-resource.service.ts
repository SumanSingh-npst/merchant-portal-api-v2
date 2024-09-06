import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { Injectable } from '@nestjs/common';
import { update } from './dtos/update.dto';

@Injectable()
export class SharedResourceService {
  constructor(@InjectClickHouse() private readonly db: ClickHouseClient) {}

  public async update(body: update) {
    try {
      const query = `ALTER TABLE "${body.tableName}" 
                    UPDATE ${body.property} = '${body.value}' 
                    WHERE ${body.identifier} = '${body.identifierValue}'`;
      await this.db.query({ query: query });

      return {
        data: 'successfully update your user!',
        status: true,
        msg: 'success',
        statusCode: 200,
      };
    } catch (error) {
      console.log(error);
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }

  private async allTables() {
    try {
      const query = `SHOW TABLES`;
      await this.db.query({ query: query });
    } catch (error) {
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }
}
