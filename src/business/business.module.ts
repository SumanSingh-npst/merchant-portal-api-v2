import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BankService } from './bank/bank.service';
import { SharedResourceService } from 'src/shared-resource/shared-resource.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, BankService, SharedResourceService],
})
export class BusinessModule {}
