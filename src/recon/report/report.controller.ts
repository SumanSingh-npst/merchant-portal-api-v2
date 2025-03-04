import { Controller, Post, Body, Res } from '@nestjs/common';
import { ReportService } from './report.service';
import { GetTXNDTO } from '../dtos/get-txn.dto';
import { GetTXNCountDTO } from '../dtos/get-txn-count.dto';
import { DownloadRequestDTO } from '../dtos/download-request.dto';
import { ZipService } from './zip.service';
import { Response } from 'express'; // Import the Response type from express

@Controller('recon/report')
export class ReportController {
  constructor(
    private readonly reportSvc: ReportService,
    private zipService: ZipService,
  ) {}

  @Post('/getTXNS')
  async getTXNByType(@Body() body: any) {
    return await this.reportSvc.getAllTXN(body);
  }

  @Post('/getAllCount')
  async getAllCount(@Body() body: GetTXNCountDTO) {
    return await this.reportSvc.getAllCount(
      body.startDate,
      body.endDate,
      body.txnType,
    );
  }

  @Post('/getAllSuccessCount')
  async getAllSuccessCount(@Body() body: GetTXNCountDTO) {
    return await this.reportSvc.getAllSuccessCount(
      body.startDate,
      body.endDate,
      body.txnType,
    );
  }

  @Post('/getAllFailureCount')
  async getAllFailureCount(@Body() body: GetTXNCountDTO) {
    return await this.reportSvc.getAllFailureCount(
      body.startDate,
      body.endDate,
      body.txnType,
    );
  }

  @Post('/downloadTXNS')
  async downloadTXNS(@Body() body: DownloadRequestDTO, @Res() res: Response) {
    const chunkSize = 9000;
    const totalRecords = await this.reportSvc.getAllTXNCount(
      body.startDate,
      body.endDate,
      body.txnType,
    );
    await this.reportSvc.processChunks(
      body.startDate,
      body.endDate,
      body.txnType,
      chunkSize,
      totalRecords,
    );
    this.zipService.finalizeZip();

    // Stream the ZIP file to the client
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=transactions.zip',
    );
    this.zipService.getZipStream().pipe(res);
  }
}
