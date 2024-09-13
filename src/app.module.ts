import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReconModule } from './recon/recon.module';
import { MulterModule } from '@nestjs/platform-express';
import { ClickHouseModule } from '@md03/nestjs-clickhouse';
import { DownloadModule } from './download/download.module';
import { CustomSettingModule } from './custom-setting/custom-setting.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { AuditModule } from './audit/audit.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { TokenValidationInterceptor } from './interceptors/token-validation.interceptor';
import { UserModule } from './user/user.module';
import { EncryptionService } from './common/encryption/encryption.service';
import { OtpModule } from './otp/otp.module';
import { SharedResourceModule } from './shared-resource/shared-resource.module';
import { VerificationModule } from './verification/verification.module';
import { BusinessModule } from './business/business.module';

@Module({
  imports: [
    ConfigModule,

    AuthModule,
    ReconModule,
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
      url: 'https://vzl9tbrfra.ap-south-1.aws.clickhouse.cloud:8443',
      username: 'default',
      password: 'CsRCIAHoU.3jJ',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    DownloadModule,
    CustomSettingModule,
    AuthModule,
    AuditModule,
    UserModule,
    OtpModule,
    SharedResourceModule,
    VerificationModule,
    BusinessModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    TokenValidationInterceptor,
    EncryptionService,
  ],
})
export class AppModule {}
