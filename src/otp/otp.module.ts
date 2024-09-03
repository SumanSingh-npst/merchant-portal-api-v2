import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { ConfigService } from '@nestjs/config';
import { AuditService } from 'src/audit/audit.service';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { Logger, Module } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';


@Module({
  imports: [HttpModule],

  controllers: [OtpController],
  providers: [
    OtpService,
    ConfigService,
    Logger,
    EncryptionService,
    AuditService,
  ],
})
export class OtpModule {}
