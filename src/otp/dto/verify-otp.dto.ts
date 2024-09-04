import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { OTPTYPE } from './send-otp.dto';

export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 characters long' })
  otp: string;

  @IsNotEmpty()
  @IsEnum(OTPTYPE, { message: 'otpType must be either EMAIL or SMS' })
  otpType: OTPTYPE;
}
