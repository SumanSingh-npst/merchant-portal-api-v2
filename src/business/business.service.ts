import { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { add_Email_In_Business } from './dto/add-email-business.dto';
import { SharedResourceService } from 'src/shared-resource/shared-resource.service';

@Injectable()
export class BusinessService {
  constructor(
    @InjectClickHouse() private readonly clickdb: ClickHouseClient,

    private configSvc: ConfigService,
    private readonly shared: SharedResourceService,
  ) {}

  async create(body: any): Promise<any> {
    const checkQuery = `SELECT * FROM BUSINESS WHERE userId = '${body.userId}'`;
    try {
      const result = await this.clickdb.query({ query: checkQuery });
      const jsonRes: any = await result.json();
      console.log(jsonRes);
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

  public async addEmailInBusiness(body: add_Email_In_Business) {
    try {
      console.log(body);
      const query = `INSERT INTO BUSINESS (businessEmail) VALUES ('${body.businessEmail}')`;


      

      const data: any = await this.clickdb.exec({ query: query });
      console.log(data);

      return {
        data: data.data[0],
        status: true,
        msg: 'success',
        statusCode: 200,
      };
    } catch (error) {
      console.log(error);
      return { res: error, status: false, statusCode: 500, msg: 'error' };
    }
  }
}
