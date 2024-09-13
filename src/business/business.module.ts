import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BankService } from './bank/bank.service';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, BankService],
})
export class BusinessModule {}
