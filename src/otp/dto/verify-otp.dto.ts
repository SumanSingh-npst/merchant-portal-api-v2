import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { OTP_TYPE } from './send-otp.dto';

export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  public readonly userId: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 characters long' })
  public readonly otp: string;

  @IsNotEmpty()
  @IsEnum(OTP_TYPE, { message: 'otpType must be either EMAIL or SMS' })
  public readonly otpType: OTP_TYPE;
}
