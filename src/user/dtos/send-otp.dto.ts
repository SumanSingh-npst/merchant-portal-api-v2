export class SendOTPDto {
  public readonly email: string;
  public readonly mobile: string;
  public readonly otp: number;
  public readonly otpType: string;
  public readonly fullName: string;
  public readonly userId: string;
}
