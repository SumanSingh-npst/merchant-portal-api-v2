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
      console.log(body.createdOn);

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
    const businessIdExists = await this.shared.findByValue({
      tableName: 'BUSINESS',
      identifier: 'BUSINESS_ID',
      identifierValue: body.businessId,
    });

    if (!businessIdExists.status) {
      return { data: null, status: false, msg: `Business ID doesn't exist` };
    }

    body.verifiedOn = new Date().toISOString().split('T')[0];
    body.documentRawData = JSON.stringify(body.documentRawData);

    const insertQuery = `INSERT INTO DOCUMENTS (DOCUMENT_NO, DOCUMENT_STATUS, VERIFIED_ON, DOCUMENT_RAW_DATA, DOCUMENT_TYPE, DOCUMENT_REFERENCE_ID, KYC_PROVIDER) 
                         VALUES ('${body.documentNo}', '${body.documentStatus}', '${body.verifiedOn}', '${body.documentRawData}', '${body.documentType}', '${body.businessId}', '${body.KYCProvider}')`;

    try {
      const result: any = await this.clickdb.command({ query: insertQuery });
      console.log(result);

      //fix this for error 👇👇👇
      return result
        ? { data: result, status: true, msg: 'Document saved successfully' }
        : { data: 'error', status: false, msg: 'Failed to save the document' };
    } catch (error) {
      console.error(error);
      return { data: null, status: false, msg: 'Error executing query' };
    }
  }

  public async businessRegistration(body: any) {
    const businessIdExists = await this.shared.findByValue({
      tableName: 'BUSINESS',
      identifier: 'BUSINESS_ID',
      identifierValue: body.businessId,
    });

    if (!businessIdExists.status) {
      return { data: null, status: false, msg: `Business ID doesn't exist` };
    }
    // ${body.isGSTpresent}
    // '${body.applicableOption}'

    const alterQuery = `
    ALTER TABLE BUSINESS 
    UPDATE 
    BUSINESS_REGISTRATION_NAME = '${body.businessRegistrationName}',
        IS_GST_PRESENT =true,
        IS_TURNOVER_LESS_THAN_LIMIT = true,
        BUSINESS_NAME = '${body.businessRegistrationName}'
    WHERE BUSINESS_ID = '${body.businessId}';
`;
    console.log(alterQuery);
    await this.clickdb.command({ query: alterQuery });

    const addressQuery = `INSERT INTO ADDRESS_INFO (ADDRESS_LINE,CITY,STATE,COUNTRY,PINCODE VALUES ('${body.businessAddress}', '${body.city}','${body.state}','${body.country}','${body.pincode}'`;

    const result: any = await this.clickdb.command({ query: addressQuery });
    console.log(result);
  }
}
