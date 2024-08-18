import { Module } from '@nestjs/common';
import { ReconService } from './recon.service.old';
import { ReconController } from './recon.controller';
import { FileUploadController } from './file-upload/file-upload.controller';
import { FileValidationService } from './file-upload/file-validation.service';
import { DBService } from './file-upload/db.service';
import { ReportController } from './report/report.controller';
import { ReportService } from './report/report.service';
import { DbController } from './file-upload/db.controller';
import { CustomLogger } from 'src/custom-logger';
import { FileUploadService } from './file-upload/file-upload.service';
@Module({
  controllers: [ReconController, FileUploadController, ReportController, DbController],
  providers: [ReconService, FileUploadService, FileValidationService, DBService, ReportService, CustomLogger],
})
export class ReconModule { }
