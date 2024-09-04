import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OTPTYPE } from './send-otp.dto';  // Assuming you have an enum defined for OTP types

export class SendSMSDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(OTPTYPE, { message: 'otpType must be either EMAIL or SMS' })
  @IsNotEmpty()
  otpType: OTPTYPE;

  @IsString()
  @IsNotEmpty()
  mobileNo: string;
}
