import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { SendOTPDto } from './dtos/send-otp.dto';
import { OtpService } from './otp/otp.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private otp: OtpService,
  ) {}

  @Get('/all')
  async getAllUser() {}

  @Get('/findOneByEmail/:email')
  async findOneByEmail(@Param('email') email: string) {
    return await this.userService.findOneByEmail(email);
  }

  @Post('sendOTP')
  async sendEmailOTP(@Body() body: SendOTPDto) {
    return await this.otp.sendOTP(
      body.email,
      body.fullName,
      body.userId,
      body.otpType,
    );
  }

  @Post('verifyOTP')
  async verifyOTP(
    @Body() body: { userId: string; otp: string; otpType: string },
  ) {
    return await this.otp.verifyOTP(body.userId, body.otp, body.otpType);
  }

  @Post('otpVerified')
  async isOTPVerified(@Body() body: { userId: string; otpType: string }) {
    return await this.otp.isOTPVerified(body.userId, body.otpType);
  }

  @Post('/test')
  async test(@Body() user: any) {
    return await this.userService.createUser(user);
  }
}
//1. //find by email
//2. //create user => create user taking userId, email , password, failedAttempt
// createdOn
// disabled
// passwordResetDate
// lastLoggedIn
//3. sendotp: insert new row in OTP_VERIFICATION table TAKING all defualt values mentioned in otpSvc
//4. verifyOTP: update OTP_VERIFICATION table with verified otp provided by user
//5. updateUser: update USER with new provided mobileno
//6. sendotp: insert new row in OTP_VERIFICATION table TAKING all defualt values mentioned in otpSvc
//7. emailVerStatus: provide userId to check verification field in OTP_VERIFICATION

//...
//8. PAN VER
