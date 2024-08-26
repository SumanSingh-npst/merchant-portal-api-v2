import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {


  }


  @Get('/all')
  async getAllUser() {

  }

  @Get('/findOneByEmail/:email')
  async findOneByEmail(@Param('email') email: string) {
    return await this.userService.findOneByEmail(email);

  }
}
