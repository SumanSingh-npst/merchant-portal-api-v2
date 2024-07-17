import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReconModule } from './recon/recon.module';
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [ReconModule, FileUploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
