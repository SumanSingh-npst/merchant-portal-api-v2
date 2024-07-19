import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ReconService } from './recon.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Multer } from 'multer';
@Controller('recon')
export class ReconController {
  constructor(private readonly reconService: ReconService) {
  }

  @Post('/initiate2WayRecon')
  @UseInterceptors(FileInterceptor('switchFile'))
  @UseInterceptors(FileInterceptor('npciFile'))
  async initiate2WayRecon(@UploadedFile() switchFiles: Multer.File[], @UploadedFile() npciFiles: Multer.File[]) {
    return this.reconService.initiate2WayRecon(switchFiles, npciFiles);
  }


  async

}
