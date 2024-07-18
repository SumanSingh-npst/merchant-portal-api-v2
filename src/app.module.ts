import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReconModule } from './recon/recon.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { MulterModule } from '@nestjs/platform-express';
import { ClickHouseModule } from '@depyronick/nestjs-clickhouse';

@Module({
  imports: [ReconModule, FileUploadModule,
    ClickHouseModule.register([{
      name: 'clickhouse_server',
      username: 'clickhouse_admin',
      host: '103.209.147.51',
      password: 'j38h39skmTNnsjwT',
      port: 8123,
    }]),
    MulterModule.register({
      dest: './uploads',
    }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
