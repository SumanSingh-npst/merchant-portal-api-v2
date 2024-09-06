import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { update_user } from './dtos/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/all')
  async getAllUser() {}

  @Get('/findOneByEmail/:email')
  async findOneByEmail(@Param('email') email: string) {
    return await this.userService.findOneByEmail(email);
  }

  @Post('/update')
  async update(@Body() body: update_user) {
    return await this.userService.update(body);
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
