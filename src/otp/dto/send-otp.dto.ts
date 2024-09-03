import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum OTPTYPE {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export class SendOTPDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  otp?: number;

  @IsNotEmpty()
  @IsEnum(OTPTYPE, { message: 'otpType must be either EMAIL or SMS' })
  otpType: OTPTYPE;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
