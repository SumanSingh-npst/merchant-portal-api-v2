import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { Injectable } from '@nestjs/common';
import { Find, update } from './dtos/update.dto';

@Injectable()
export class SharedResourceService {
  constructor(@InjectClickHouse() private readonly db: ClickHouseClient) {}

  public async update(body: update) {
    try {
      const tableCheck = await this.allTables();

      let tablePresent = false;
      tableCheck.data.map((data: { name: string }) => {
        if (data.name === body.tableName) {
          tablePresent = true;
        }
      });

      if (tablePresent) {
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
      } else
        return {
          data: 'table not found',
          status: false,
          msg: 'not found',
          statusCode: 404,
        };
    } catch (error) {
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }

  public async findByValue(body: Find) {
    try {
      const query = `SELECT * FROM "${body.tableName}" 
                     WHERE ${body.identifier} = '${body.identifierValue}'`;

      const data: any = await this.responseConstructor(query);

      return data.data.length == 0
        ? {
            data: null,
            status: false,
            msg: 'No records found',
            statusCode: 404,
          }
        : {
            data: data.data[0],
            status: true,
            msg: 'Data retrieved successfully',
            statusCode: 200,
          };
    } catch (error) {
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }

  private async allTables() {
    try {
      const query = `SHOW TABLES`;
      const data: any = await this.responseConstructor(query);
      return {
        data: data.data,
        status: true,
        msg: 'success',
        statusCode: 200,
      };
    } catch (error) {
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }

  public async responseConstructor(query: string) {
    try {
      const table = await this.db.query({ query });
      const data = await table.json();
      return data;
    } catch (error) {
      console.log(error);
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }
  toIST(date: Date): string {
    // const offset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const istDate = new Date(date);
    
    return istDate
      .toISOString()
      // .slice(0, 19) // Slices to get 'YYYY-MM-DDTHH:mm:ss'
      // .replace('T', ' '); // Replaces 'T' with space
  }
  
}
