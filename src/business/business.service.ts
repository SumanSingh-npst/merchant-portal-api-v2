import { Injectable } from '@nestjs/common';
import { SharedResourceService } from 'src/shared-resource/shared-resource.service';
import { add_Email_In_Business } from './dto/add-email-business.dto';

@Injectable()
export class BusinessService {
  constructor(private readonly shared: SharedResourceService) {}

  public async addEmailInBusiness(body: add_Email_In_Business) {
    try {
      const query = `INSERT TABLE BUSINESS (businessEmail) VALUE ('${body.businessEmail}')`;
      const data: any = await this.shared.responseConstructor(query);
      return data.data.length > 0
        ? {
            data: data.data[0],
            status: true,
            msg: 'success',
            statusCode: 200,
          }
        : {
            data: null,
            status: false,
            msg: 'not found',
            statusCode: 404,
          };
    } catch (error) {
      return { res: error, status: false, statusCode: 500, msg: 'error' };
    }
  }
}
