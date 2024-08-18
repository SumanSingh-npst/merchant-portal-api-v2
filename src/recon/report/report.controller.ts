import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
import { GetTXNDTO } from '../dtos/get-txn.dto';
@Controller('recon/report')
export class ReportController {
    constructor(private readonly reportSvc: ReportService) {
    }

    @Post('/getTXNS')
    async getTXNByType(@Body() body: GetTXNDTO) {
        return await this.reportSvc.getAllTXN(body.startDate, body.endDate, body.startPosition, body.offset, body.txnType);
    }

    @Post('/getReconCountByDate')
    async getReconCountByDate(@Body() body: { startDate: string, endDate: string }) {
        const { startDate, endDate } = body;
        // Validate date format using regular expression
        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
            throw new BadRequestException('Invalid date format. Please use yyyy-mm-dd format.');
        }
        return await this.reportSvc.getReconCountByDate(body.startDate, body.endDate);
    }
}
