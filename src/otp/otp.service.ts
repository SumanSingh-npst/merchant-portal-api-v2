import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { SendOTPDto } from './dto/send-otp.dto';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { VerifyOTPDto } from './dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    @InjectClickHouse() private readonly clickdb: ClickHouseClient,
    private configSvc: ConfigService,
    private http: HttpService,
    private logger: Logger,
    private encSvc: EncryptionService,
  ) {}

  private async saveOTP(
    userId: string,
    otp: string,
    otpType: string,
    request_id: string,
  ) {
    const insert = `INSERT INTO OTP_VERIFICATION (USER_ID,OTP_TYPE,OTP_VALUE,CREATED_ON,REQUEST_ID) 
            VALUES  ('${userId}','${otpType}', '${otp}','${new Date().toISOString()}', '${request_id}');`;
    try {
      await this.clickdb.exec({ query: insert });
      return true;
    } catch (error) {
      throw new Error(error);
    }
  }

  public async sendOTP(body: SendOTPDto) {
    console.log(body);
    const otp = Math.floor(100000 + Math.random() * 900000);

    const payload = {
      from: {
        address: 'noreply@timepayonline.com',
        name: 'Evok Timepay',
      },
      to: [
        {
          email_address: {
            address: body.email,
            name: body.fullName,
          },
        },
      ],
      subject: 'Email Verification',
      htmlbody:
        '<div><b> Your OTP for Email Verification is ' + otp + '.  </b></div>',
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: this.configSvc.get('zohoKey'),
    };

    const { data } = await firstValueFrom(
      this.http
        .post('https://api.zeptomail.in/v1.1/email', payload, { headers })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    if (data.data && data.data[0].code == 'EM_104') {
      const encOTP = await this.encSvc.encrypt(otp.toString());
      await this.saveOTP(body.userId, encOTP, body.otpType, data.request_id);
    } else {
      throw 'An error encountered while sending otp!';
    }
    return data;
  }

  async verifyOTP(body: VerifyOTPDto) {
    console.log(body);
    const { userId, otp, otpType } = body;
    const query = `
    SELECT OTP_VALUE 
    FROM OTP_VERIFICATION 
    WHERE USER_ID = '${userId}' 
      AND OTP_TYPE = '${otpType}' 
    ORDER BY CREATED_ON DESC 
    LIMIT 1;
  `;    try {
      const r = await this.clickdb.query({ query: query });
      const jsonRes: any = await r.json();
      if (jsonRes.data.length === 0) {
        throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
      } else {
        //decrypt the otp
        const decryptedOTP = await this.encSvc.decrypt(
          jsonRes.data[0].OTP_VALUE,
        );
        console.log('otp compare=>', decryptedOTP, otp);

        if (decryptedOTP === otp) {
          const date = new Date();
          const formattedDate = date
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '); // Strip milliseconds and format

          await this.clickdb.exec({
            query: `ALTER TABLE OTP_VERIFICATION UPDATE VERIFIED = true, VERIFIED_ON = '${formattedDate}' 
                    WHERE USER_ID = '${userId}' AND OTP_TYPE = '${otpType}';`,
          });

          return true;
        } else {
          throw new HttpException(
            'OTP does not match. Verification failed.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async isOTPVerified(userId: string, otpType: string) {
    const query = `SELECT * FROM OTP_VERIFICATION WHERE USER_ID = '${userId}' AND OTP_TYPE = '${otpType}' AND VERIFIED = true;`;
    try {
      const r = await this.clickdb.query({ query: query });
      const jsonRes: any = await r.json();
      return jsonRes.data.length > 0 ? true : false;
    } catch (error) {
      throw error;
    }
  }
}
