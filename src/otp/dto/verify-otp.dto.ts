import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OTPTYPE } from './send-otp.dto';

export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()  otp: string;

  @IsNotEmpty()
  @IsEnum(OTPTYPE, { message: 'otpType must be either EMAIL or SMS' })
  otpType: OTPTYPE;

}
