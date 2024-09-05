import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OTP_TYPE } from './send-otp.dto'; // Assuming you have an enum defined for OTP types

export class SendSMSDto {
  @IsString()
  @IsNotEmpty()
  public readonly userId: string;

  @IsEnum(OTP_TYPE, { message: 'otpType must be either EMAIL or SMS' })
  @IsNotEmpty()
  public readonly otpType: OTP_TYPE;

  @IsString()
  @IsNotEmpty()
  public readonly mobileNo: string;
}
