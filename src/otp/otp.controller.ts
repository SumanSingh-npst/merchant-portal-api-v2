import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOTPDto } from './dto/send-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { SendSMSDto } from './dto/send-sms.dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('sendOTP')
  async sendEmailOTP(@Body() body: SendOTPDto) {
    return await this.otp.sendOTP(body);
  }

  @Post('sendSMS')
  async sendSMSOTP(@Body() body: SendSMSDto) {
    return await this.otp.sendSms(body);
  }

  @Post('verifyOTP')
  async verifyOTP(@Body() body: VerifyOTPDto) {
    return await this.otp.verifyOTP(body);
  }

  @Post('otpVerified')
  async isOTPVerified(@Body() body: { userId: string; otpType: string }) {
    return await this.otp.isOTPVerified(body.userId, body.otpType);
  }
}
