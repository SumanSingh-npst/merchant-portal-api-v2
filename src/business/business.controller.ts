import { Body, Controller } from '@nestjs/common';
import { BusinessService } from './business.service';
import { add_Email_In_Business } from './dto/add-email-business.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  async addEmailInBusiness(@Body() body: add_Email_In_Business) {
    return await this.businessService.addEmailInBusiness(body);
  }
}
