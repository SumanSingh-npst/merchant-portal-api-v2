import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Multer } from 'multer';
import { ReconService } from './recon.service';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/role.decorator';
@Controller('recon')
@UseGuards(RolesGuard)
@Roles('admin')
export class ReconController {
  constructor(private readonly reconService: ReconService) {
  }

  @Get('/initiate2WayRecon')
  async initiate2WayRecon() {
    return await this.reconService.initiateTwoWayRecon();
  }

}
