import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from 'src/config/config.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [UserModule, PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import your custom ConfigModule
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Retrieve JWT_SECRET from your custom ConfigModule
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    })],
  providers: [AuthService, LocalStrategy, UserService, JwtService],
  controllers: [AuthController],
  exports: [AuthService, JwtService],
})
export class AuthModule {

  constructor(private configSvc: ConfigService) {
    console.log('inside AuthModule=>', configSvc.get('JWT_SECRET'));
  }
}
