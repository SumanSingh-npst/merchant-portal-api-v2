import { IsString, Length, Matches } from 'class-validator';

export class PanVerificationDto {
  @IsString()
  @Matches(/[A-Z]{5}[0-9]{4}[A-Z]{1}/, {
    message: 'PAN number must be a valid 10-character alphanumeric string',
  })
  id_number: string;
}

export class GstVerificationDto {
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{3}$/, {
    message: 'GST number must be a valid 15-character alphanumeric string',
  })
  id_number: string;
}

export class AadhaarVerificationDto {
  @IsString()
  @Matches(/^[0-9]{12}$/, {
    message: 'Aadhaar number must be a valid 12-digit number',
  })
  id_number: string;
}

export class verifyAadhaarOTP {
  @IsString()
  client_id: string;
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 characters long' })
  otp: string;
}
