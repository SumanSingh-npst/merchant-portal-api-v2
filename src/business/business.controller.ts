import { Body, Controller, Post } from '@nestjs/common';
import { BusinessService } from './business.service';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}


  @Post('create')
  verifyPan(@Body() body: any) {
    return this.businessService.create(body);
  }

}
