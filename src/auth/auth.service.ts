import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AxiosError } from 'axios';
import * as bcrypt from 'bcryptjs';
import { error } from 'console';
import { catchError, firstValueFrom, last } from 'rxjs';
import { AuditService } from 'src/audit/audit.service';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { User } from 'src/user/dtos/user.dto';
import { UserService } from 'src/user/user.service';
import { threadId } from 'worker_threads';

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService: UserService,
        private readonly jwtService: JwtService,
        private configSvc: ConfigService,
        private http: HttpService,
        private logger: Logger,
        private auditSvc: AuditService,
        private encSvc: EncryptionService
    ) { }


    async emailExists(email: string) {
        return await this.usersService.findOneByEmail(email);
    }
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

    logout(user: any) {
        return true;
    }

    async login(user: Omit<User, 'password'>) {
        const payload = {
            userId: user.userId,
            fullName: user.fullName,
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
                expiresIn: '60m',
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
