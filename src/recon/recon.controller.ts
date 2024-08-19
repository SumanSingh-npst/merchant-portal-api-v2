import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Multer } from 'multer';
import { ReconService } from './recon.service';
@Controller('recon')
export class ReconController {
  constructor(private readonly reconService: ReconService) {
  }

  @Get('/initiate2WayRecon')
  async initiate2WayRecon() {
    return await this.reconService.initiateTwoWayRecon();
  }

}
