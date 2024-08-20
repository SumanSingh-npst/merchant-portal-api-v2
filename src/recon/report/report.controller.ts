import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
import { GetTXNDTO } from '../dtos/get-txn.dto';
import { GetTXNCountDTO } from '../dtos/get-txn-count.dto';
@Controller('recon/report')
export class ReportController {
    constructor(private readonly reportSvc: ReportService) {
    }

    @Post('/getTXNS')
    async getTXNByType(@Body() body: GetTXNDTO) {
        return await this.reportSvc.getAllTXN(body.startDate, body.endDate, body.startPosition, body.offset, body.txnType);

    }

    @Post('/getAllCount')
    async getAllCountByDate(@Body() body: GetTXNCountDTO) {
        const { startDate, endDate } = body;
        return await this.reportSvc.getAllCount(body.startDate, body.endDate, body.txnType);
    }
}
