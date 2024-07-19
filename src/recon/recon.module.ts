import { Module } from '@nestjs/common';
import { ReconService } from './recon.service';
import { ReconController } from './recon.controller';
import { FileUploadController } from './file-upload/file-upload.controller';
import { FileUploadService } from './file-upload/file-upload.service';
import { FileValidationService } from './file-upload/file-validation.service';
@Module({
  controllers: [ReconController, FileUploadController],
  providers: [ReconService, FileUploadService, FileValidationService],
})
export class ReconModule { }
