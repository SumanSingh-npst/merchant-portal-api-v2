import { IsNotEmpty, IsString } from 'class-validator';

export class SendSMSDto {
  @IsString()
  @IsNotEmpty()
  senderid: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  numbers: string;
}
