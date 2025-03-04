import { Logger, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AuditService } from 'src/audit/audit.service';

@Module({
  imports: [HttpModule],
  controllers: [UserController],
  providers: [UserService, Logger, EncryptionService, AuditService],
})
export class UserModule { }
