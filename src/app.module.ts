import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReconModule } from './recon/recon.module';
import { MulterModule } from '@nestjs/platform-express';
import { ClickHouseModule } from '@md03/nestjs-clickhouse';

@Module({
  imports: [ReconModule,
    ClickHouseModule.forRoot({
      clickhouse_settings: {
        async_insert: 1,
      },
      host: 'http://103.209.147.51:8123',
      username: 'clickhouse_admin',
      password: 'j38h39skmTNnsjwT',

    }),
    MulterModule.register({
      dest: './uploads',
    })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
