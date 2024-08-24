import { Module } from '@nestjs/common';
import { CustomSettingService } from './custom-setting.service';
import { CustomSettingController } from './custom-setting.controller';

@Module({
  controllers: [CustomSettingController],
  providers: [CustomSettingService],
})
export class CustomSettingModule {}
