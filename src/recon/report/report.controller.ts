import { Controller, Get, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
@Controller('recon/report')
export class ReportController {
    constructor(private readonly reportSvc: ReportService) {
    }


    @Post('/getSwitchTXN')
    async getSwitchTXN(@Body() body: { startDate: string, endDate: string, startPosition: number, offset: number }) {
        const { startDate, endDate, startPosition, offset } = body;

        // Validate date format using regular expression
        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
            throw new BadRequestException('Invalid date format. Please use yyyy-mm-dd format.');
        }

        // Validate startPosition and offset
        if (startPosition < 0 || offset <= 0) {
            throw new BadRequestException('Invalid startPosition or offset. startPosition must be >= 0 and offset must be > 0.');
        }
        return await this.reportSvc.getSwitchTXN(body.startDate, body.endDate, body.startPosition, body.offset);
    }

    @Post('/getInvalidTXN')
    async getInvalidTXN(@Body() body: { startDate: string, endDate: string, startPosition: number, offset: number }) {
        const { startDate, endDate, startPosition, offset } = body;

        // Validate date format using regular expression
        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
            throw new BadRequestException('Invalid date format. Please use yyyy-mm-dd format.');
        }

        // Validate startPosition and offset
        if (startPosition < 0 || offset <= 0) {
            throw new BadRequestException('Invalid startPosition or offset. startPosition must be >= 0 and offset must be > 0.');
        }
        return await this.reportSvc.getInvalidTXN(body.startDate, body.endDate, body.startPosition, body.offset);
    }


    @Post('/getDuplicateTXN')
    async getDuplicateTXN(@Body() body: { startDate: string, endDate: string, startPosition: number, offset: number }) {
        const { startDate, endDate, startPosition, offset } = body;

        // Validate date format using regular expression
        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormatRegex.test(startDate) || !dateFormatRegex.test(endDate)) {
            throw new BadRequestException('Invalid date format. Please use yyyy-mm-dd format.');
        }

        // Validate startPosition and offset
        if (startPosition < 0 || offset <= 0) {
            throw new BadRequestException('Invalid startPosition or offset. startPosition must be >= 0 and offset must be > 0.');
        }
        return await this.reportSvc.getDuplicateTXN(body.startDate, body.endDate, body.startPosition, body.offset);
    }
}
