import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum OTP_TYPE {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export class SendOTPDto {
  @IsOptional()
  @IsString()
  public readonly email?: string;

  @IsOptional()
  @IsString()
  public readonly mobile?: string;

  @IsOptional()
  public readonly otp?: number;

  @IsNotEmpty()
  @IsEnum(OTP_TYPE, { message: 'otpType must be either EMAIL or SMS' })
  public readonly otpType: OTP_TYPE;

  @IsNotEmpty()
  @IsString()
  public readonly fullName: string;

  @IsNotEmpty()
  @IsString()
  public readonly userId: string;
}
