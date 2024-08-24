import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReconModule } from './recon/recon.module';
import { MulterModule } from '@nestjs/platform-express';
import { ClickHouseModule } from '@md03/nestjs-clickhouse';
import { DownloadModule } from './download/download.module';
import { CustomSettingModule } from './custom-setting/custom-setting.module';

@Module({
  imports: [ReconModule,
    ClickHouseModule.forRoot({
      clickhouse_settings: {
        tcp_keep_alive_timeout: 60000,
        http_connection_timeout: 60000,
        wait_end_of_query: 1,
        http_headers_progress_interval_ms: '1000',

      },
      //host: 'http://103.209.147.51:8123',
      //username: 'clickhouse_admin',
      //password: 'j38h39skmTNnsjwT',
      url: '  https://vzl9tbrfra.ap-south-1.aws.clickhouse.cloud:8443',
      username: 'default',
      password: 'CsRCIAHoU.3jJ'
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    DownloadModule,
    CustomSettingModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
