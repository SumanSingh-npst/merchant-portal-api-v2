import { ClickHouseClient, QueryParams } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createBusiness, documentDto } from './dto/add-email-business.dto';
import { SharedResourceService } from 'src/shared-resource/shared-resource.service';

@Injectable()
export class BusinessService {
  constructor(
    @InjectClickHouse() private readonly clickdb: ClickHouseClient,

    private configSvc: ConfigService,
    private readonly shared: SharedResourceService,
  ) {}

  // async create(body: any): Promise<any> {
  //   const checkQuery = `SELECT * FROM BUSINESS WHERE userId = '${body.userId}'`;
  //   try {
  //     const result = await this.clickdb.query({ query: checkQuery });
  //     const jsonRes: any = await result.json();
  //     console.log(jsonRes);
  //     if (jsonRes.data.length > 0) {
  //       return new Error('A business record already exists for this userId.');
  //     }

  //     const insertQuery = `
  //         INSERT INTO BUSINESS (
  //           businessRegistrationName, isGstPresent, isTurnoverLessThanLimit, isBusinessCategoryExempted,
  //           businessName, businessType, businessModel, businessCategoryCode, businessSubcategory,
  //           categoryCode, businessDescription, businessWebsite, appStoreLink, contactUs, termsConditions,
  //           refundPolicy, businessEmail, userId
  //         )
  //         VALUES (
  //           '', false, false, false,
  //           '', '', '', '', '',
  //           '', '', '', '', '', '',
  //           '', '', '${body.userId}'
  //         );
  //       `;

  //     await this.clickdb.exec({ query: insertQuery });
  //     return { message: 'Business record inserted successfully' };
  //   } catch (error) {
  //     console.error('Error:', error);
  //     throw new Error('Failed to insert business record or check existence');
  //   }
  // }
  public async create(body: createBusiness) {
    try {
      console.log(body);
      const businessExists = await this.shared.findByValue({
        tableName: 'BUSINESS',
        identifier: 'BUSINESS_EMAIL',
        identifierValue: body.businessEmail,
      });
      console.log(businessExists);

      if (businessExists.status) {
        return {
          data: null,
          status: false,
          msg: 'Email already exists in business',
        };
      }
      // body.createdOn = new Date();
      // const createdOnIST = await this.shared.toIST(body.createdOn);

      body.createdOn = new Date().toISOString().split('T')[0];
      console.log(body.createdOn)
  

      const insertQuery = `INSERT INTO BUSINESS (BUSINESS_EMAIL, USER_ID, CREATED_ON) VALUES ('${body.businessEmail}', '${body.userId}', '${body.createdOn}')`;
      await this.clickdb.command({ query: insertQuery });

      const selectQuery = `SELECT BUSINESS_ID FROM BUSINESS WHERE BUSINESS_EMAIL ='${body.businessEmail}' LIMIT 1`;

      const r = await this.clickdb.query({ query: selectQuery });
      const result: any = await r.json();

      let businessId;

      if (result.data && result.data.length > 0) {
        businessId = result.data[0].BUSINESS_ID;
      }

      if (!businessId) {
        throw new Error('businessId not found');
      }

      return {
        data: businessId,
        status: true,
        msg: 'success',
      };
    } catch (error) {
      console.log(error);
      return { res: error, status: false, statusCode: 500, msg: 'error' };
    }
  }

  public async saveDocument(body: documentDto) {
    body.verifiedOn = new Date().toISOString().split('T')[0];
    console.log(body.verifiedOn)

    const insertQuery = `INSERT INTO DOCUMENTS (DOCUMENT_NO, DOCUMENT_STATUS, VERIFIED_ON, DOCUMENT_RAW_DATA, DOCUMENT_TYPE, DOCUMENT_REFERENCE_ID) VALUES ('${body.documentNo}', '${body.documentStatus}',   '${body.verifiedOn}' ,'${body.documentRawData}' ,'${body.documentType}','${body.businessId}')`;
    await this.clickdb.command({ query: insertQuery });
  }
}
