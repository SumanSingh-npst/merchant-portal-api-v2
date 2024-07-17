import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ReconService } from './recon.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Multer } from 'multer';
@Controller('recon')
export class ReconController {
  constructor(private readonly reconService: ReconService) {


  }


  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Multer.File) {
    return this.reconService.validateAndStoreFile(file);
  }
  // async initiateRecon() {
  //   return await this.reconService.initiate2WayRecon();
  // }



}
