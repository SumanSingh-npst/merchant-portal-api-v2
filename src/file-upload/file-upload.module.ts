import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { ReconModule } from 'src/recon/recon.module';
import { ReconService } from 'src/recon/recon.service';

@Module({
  imports: [ReconModule],
  controllers: [FileUploadController],
  providers: [FileUploadService, ReconService],
})
export class FileUploadModule { }
