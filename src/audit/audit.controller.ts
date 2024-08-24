import { Body, Controller, Post } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Post('/logEvent')
  async logEvent(@Body() body: { userId: string, eventType: string, ipAddress: string, details: string, requestBody: any }) {
    console.log(body);
    await this.auditService.logEvent(body.userId, body.eventType, body.ipAddress, body.details, body.requestBody);
  }

  @Post('/getlogs')
  async getAuditLogs(@Body() body: { startDate: string, endDate: string }) {
    return await this.auditService.getAuditLogs(body.startDate, body.endDate);
  }
}
