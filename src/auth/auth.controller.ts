import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { User } from 'src/user/dtos/user.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authSvc: AuthService) {

    }

    @Post('login')
    @UseGuards(LocalAuthGuard) // Assuming you have a LocalAuthGuard to handle the login logic
    async login(@Request() req) {
        console.log('req.user=>', req.user);
        return await this.authSvc.login(req.user);
    }

    @Post('/register')
    async register(@Body() user: User) {
        console.log(user);
        return await this.authSvc.register(user);
    }

    @Post('/logout')
    async logout(@Request() req) {
        return await this.authSvc.logout(req.user);
    }

    @Get('/emailExists/:email')
    async emailExists(@Param('email') email: string) {
        return await this.authSvc.emailExists(email);
    }
}
