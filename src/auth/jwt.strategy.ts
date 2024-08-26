import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/dtos/user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
            session: false, // disable session support

        });

        console.log('JwtStrategy initialized' + configService.get('JWT_SECRET'));
    }

    async validate(payload: Partial<User>): Promise<Partial<User>> {
        return {
            userId: payload.userId,
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            mobile: payload.mobile,
            roles: payload.roles,
            lastLoggedIn: payload.lastLoggedIn,
            blocked: payload.blocked,
            failedAttempt: payload.failedAttempt,
            createdOn: payload.createdOn,
            disabled: payload.disabled,
            passwordResetDate: payload.passwordResetDate
        };
    }
}
