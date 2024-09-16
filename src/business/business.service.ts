import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BusinessService {
  constructor(
    @InjectClickHouse() private readonly clickdb: ClickHouseClient,
 
    private configSvc: ConfigService,
  ) {}

  async create(body: any): Promise<any> {   


    const checkQuery = `SELECT * FROM BUSINESS WHERE userId = '${body.userId}'`;
    try {
        const result = await this.clickdb.query({ query: checkQuery });
        const jsonRes: any = await result.json();
console.log(jsonRes)
        if (jsonRes.data.length > 0) {
          return new Error('A business record already exists for this userId.');
          
        }
    
        const insertQuery = `
          INSERT INTO BUSINESS (
            businessRegistrationName, isGstPresent, isTurnoverLessThanLimit, isBusinessCategoryExempted, 
            businessName, businessType, businessModel, businessCategoryCode, businessSubcategory, 
            categoryCode, businessDescription, businessWebsite, appStoreLink, contactUs, termsConditions, 
            refundPolicy, businessEmail, userId
          ) 
          VALUES (
            '', false, false, false, 
            '', '', '', '', '', 
            '', '', '', '', '', '', 
            '', '', '${body.userId}'
          );
        `;
    
        await this.clickdb.exec({ query: insertQuery });
        return { message: 'Business record inserted successfully' };
      } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to insert business record or check existence');
      }
    }
}
