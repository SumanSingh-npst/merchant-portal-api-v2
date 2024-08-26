import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { last } from 'rxjs';
import { User } from 'src/user/dtos/user.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        private readonly jwtService: JwtService,
        private configSvc: ConfigService
    ) { }

    async validateUser(email: string, pass: string): Promise<Omit<User, 'password'>> {
        console.log('in validate user', email, pass);
        const user = await this.usersService.findOneByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            // If the password is valid, return the user without the password
            const { password, ...result } = user;
            return result as Omit<User, 'password'>;
        }
        return null;
    }

    async login(user: Omit<User, 'password'>) {
        const payload = {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            roles: user.roles,
            lastLoggedIn: user.lastLoggedIn,
            blocked: user.blocked,
            failedAttempt: user.failedAttempt,
            createdOn: user.createdOn,
            disabled: user.disabled,
            passwordResetDate: user.passwordResetDate
        };
        return {
            access_token: this.jwtService.sign(payload, {
                secret: this.configSvc.get('JWT_SECRET'),
            }),
        };
    }


    async register(userDto: Omit<User, 'userId'>) {
        const hashedPassword = await bcrypt.hash(userDto.password, 10);
        const newUser = await this.usersService.create({
            ...userDto,
            password: hashedPassword,
        });
        return newUser;
    }
}
