import { Module } from '@nestjs/common';
import { DownloadService } from './download.service';
import { DownloadGateway } from './download.gateway';
import { CustomSettingService } from 'src/custom-setting/custom-setting.service';
import { DownloadController } from './download.controller';
import { QueueService } from './queue.service';

@Module({
  controllers: [DownloadController],
  providers: [DownloadGateway, DownloadService, CustomSettingService, QueueService],
})
export class DownloadModule { }
