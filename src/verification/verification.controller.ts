import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationDto, verifyAadhaarOTP } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('pan')
  verifyPan(@Body() body: VerificationDto) {
    return this.verificationService.verifyPan(body);
  }


  @Post('gst')
  verifyGST(@Body() body: VerificationDto) {
    return this.verificationService.verifyGST(body);
  }


  @Post('generateAadhaarOTP')
  verifyAadhaar(@Body() body: VerificationDto) {
    return this.verificationService.generateAadhaarOTP(body);
  }

  @Post('verifyAadhaarOTP')
  verifyAadhaarOTP(@Body() body: verifyAadhaarOTP) {
    return this.verificationService.verifyAadhaarOTP(body);
  }
  @Get()
  findAll() {
    return this.verificationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.verificationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVerificationDto: UpdateVerificationDto) {
    return this.verificationService.update(+id, updateVerificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.verificationService.remove(+id);
  }
}
