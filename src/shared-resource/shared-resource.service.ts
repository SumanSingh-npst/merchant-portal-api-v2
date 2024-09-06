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
      const response = await this.db.query({ query: query });
      const data: any = await response.json();
      return data.data.length > 0
        ? {
            data: 'successfully update your user!',
            status: true,
            msg: 'success',
            statusCode: 200,
          }
        : {
            data: null,
            status: false,
            msg: 'notfound',
            statusCode: 400,
          };
    } catch (error) {
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }
}
