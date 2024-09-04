import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OtpService } from './otp.service';
import { CreateOtpDto } from './dto/create-otp.dto';
import { UpdateOtpDto } from './dto/update-otp.dto';
import { SendOTPDto } from './dto/send-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { SendOtpRequestDto } from './dto/send-sms.dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('sendOTP')
  async sendEmailOTP(@Body() body: SendOTPDto) {
    return await this.otp.sendOTP(body);
  }

  @Post('sendSMS')
  async sendSMSOTP(@Body() body: SendOtpRequestDto) {
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

  @Post()
  create(@Body() createOtpDto: CreateOtpDto) {
    // return this.otpService.create(createOtpDto);
  }

  @Get()
  findAll() {
    // return this.otpService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.otpService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOtpDto: UpdateOtpDto) {
    // return this.otpService.update(+id, updateOtpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.otpService.remove(+id);
  }
}
