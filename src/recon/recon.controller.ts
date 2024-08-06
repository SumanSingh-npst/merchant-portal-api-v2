import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ReconService } from './recon.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Multer } from 'multer';
@Controller('recon')
export class ReconController {
  constructor(private readonly reconService: ReconService) {
  }

  @Post('/initiate2WayRecon')
  async initiate2WayRecon(date: string) {
    return await this.reconService.initiate2WayRecon(date);
  }

  @Get('/getTotalTXNCountByDate/:date')
  async getTotalTXNCountByDate(@Param('date') date: string) {
    console.log(date);
    return await this.reconService.getTotalTXNCountByDate(date);
  }

  @Get('/getSwitchCountByDate/:date')
  async getSwitchCountByDate(@Param('date') date: string) {
    return await this.reconService.getSwitchCountByDate(date);
  }

  @Get('/getNPCICountByDate/:date')
  async getNPCICountByDate(@Param('date') date: string) {
    return await this.reconService.getNPCICountByDate(date);
  }

  @Get('/getTotalReconCountByDate/:date')
  async getTotalReconCountByDate(@Param('date') date: string) {
    return await this.reconService.getTotalReconCountByDate(date);
  }

  @Get('/getReconTXNS/:date')
  async getReconTXNS(@Param('date') date: string) {
    return await this.reconService.getReconTXNS(date);
  }

  @Get('/getSuccessTXNS/:date')
  async getSuccessTXNS(@Param('date') date: string) {
    return await this.reconService.getSuccessTXNS(date);
  }

  @Get('/getFailedTXNS/:date')
  async getFailedTXNS(@Param('date') date: string) {
    return await this.reconService.getFailedTXNS(date);
  }

  @Get('/getSuccessCount/:date')
  async getSuccessCount(@Param('date') date: string) {
    return await this.reconService.getSuccessCount(date);
  }

  @Get('/getFailureCount/:date')
  async getFailureCount(@Param('date') date: string) {
    return await this.reconService.getFailureCount(date);
  }

  @Get('/getMissingTXNS/:date')
  async getMissingTXNS(@Param('date') date: any) {
    return await this.reconService.getMissingTXNS(date);
  }

}
