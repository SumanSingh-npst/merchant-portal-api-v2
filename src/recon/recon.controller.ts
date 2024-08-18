import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ReconService } from './recon.service.old';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Multer } from 'multer';
@Controller('recon')
export class ReconController {
  constructor(private readonly reconService: ReconService) {
  }

  @Get('/initiate2WayRecon')
  async initiate2WayRecon() {
    return await this.reconService.initiate2WayRecon();
  }

}
