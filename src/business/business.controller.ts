import { Body, Controller, Post } from '@nestjs/common';
import { BusinessService } from './business.service';
import { createBusiness ,documentDto } from './dto/add-email-business.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}


  @Post('create')
  verifyPan(@Body() body: createBusiness) {
    return this.businessService.create(body);
  }

  @Post('saveDocument')
  saveDocument(@Body() body: documentDto) {
    return this.businessService.saveDocument(body);
  }


  @Post('registration')
  businessRegistration(@Body() body: any) {
    return this.businessService.businessRegistration(body);
  }



  // @Post('addEmail')

  // async addEmailInBusiness(@Body() body: add_Email_In_Business) {
  //   return await this.businessService.addEmailInBusiness(body);
  // }
}
