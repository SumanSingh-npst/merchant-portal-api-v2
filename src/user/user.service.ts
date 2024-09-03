import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User } from './dtos/user.dto';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AuditService } from 'src/audit/audit.service';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {


    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient,
        private http: HttpService,
        private logger: Logger,
        private auditSvc: AuditService,
        private encSvc: EncryptionService,
        private configSvc: ConfigService
    ) { }

    async create(user: User) {

        //check if the user doesn't exists
        const userExists = await this.findOneByEmail(user.email);
        console.log(userExists);
        if (userExists) {
            throw new HttpException('User already exists', HttpStatus.CONFLICT);
        }

        const user_id = Math.random().toString(36).substring(7);
        //check if the id doesn't exists if yes then regenerate one.

        user.blocked = false;
        user.failedAttempt = 0;
        user.createdOn = new Date().toISOString();
        user.disabled = false;
        user.passwordResetDate = new Date(new Date().setMonth(3)).toISOString();
        user.lastLoggedIn = new Date().toISOString();
        const query = `INSERT INTO USER (USER_ID, FULL_NAME, EMAIL, MOBILE, PASSWORD, 
        LAST_LOGGED_IN,BLOCKED, FAILED_ATTEMPT, CREATED_ON, DISABLED, PASSWORD_RESET_DATE) 
        VALUES ('${user_id}','${user.fullName}','${user.email}','${user.mobile}','${user.password}',
        '${user.lastLoggedIn}','${user.blocked}','${user.failedAttempt}','${user.createdOn}','${user.disabled}', '${user.passwordResetDate}');`;

        //roles will be multiple values in array

        const rolesQuery = `INSERT INTO USER_ROLES (USER_ID, ROLE_ID) VALUES`;
        const values = user.roles.map(role => `('${user_id}','${role}')`).join(',');
        const finalRolesQuery = `${rolesQuery} ${values};`;
        try {
            const r = await this.clickdb.exec({ query: query });
            const r2 = await this.clickdb.exec({ query: finalRolesQuery });
            return user;
        } catch (error) {
            throw error;
        }
    }

    async findOneByEmail(email: string) {
        const query = `SELECT * FROM USER WHERE EMAIL = '${email}';`;
        try {
            const r = await this.clickdb.query({ query: query });
            const jsonRes: any = await r.json();
            if (jsonRes.data.length === 0) {
                return null;
            }
            const user: User = {
                userId: jsonRes.data[0].USER_ID,
                fullName: jsonRes.data[0].FULL_NAME,
                password: jsonRes.data[0].PASSWORD,
                lastLoggedIn: jsonRes.data[0].LAST_LOGGED_IN,
                email: jsonRes.data[0].EMAIL,
                mobile: jsonRes.data[0].MOBILE,
                blocked: jsonRes.data[0].BLOCKED,
                failedAttempt: jsonRes.data[0].FAILED_ATTEMPT,
                createdOn: jsonRes.data[0].CREATED_ON,
                disabled: jsonRes.data[0].DISABLED,
                passwordResetDate: jsonRes.data[0].PASSWORD_RESET_DATE,
                roles: []
            };

            const rolesQuery = `SELECT ROLE_ID FROM USER_ROLES WHERE USER_ID = '${user.userId}';`;
            const r2 = await this.clickdb.query({ query: rolesQuery });

            const jsonRes2: any = await r2.json();

            const rolePromises = await jsonRes2.data.map(async role => {
                const r = await this.clickdb.query({ query: `SELECT ROLE_NAME FROM ROLE WHERE ROLE_ID = '${role.ROLE_ID}';` });
                const res = await r.json();
                return res.data[0];
            });

            const roles = await Promise.all(rolePromises);
            user.roles = roles.map(role => role.ROLE_NAME);
            return user;

            // for (const role of jsonRes2.data) {
            //     //fetch role name from role id

            //     user.roles.push(role.ROLE_ID);
            // }
            return user;
        } catch (error) {
            throw error;
        }

    }

    async saveOTP(userId: string, otp: string, otpType: string, request_id: string) {

        const insert = `INSERT INTO OTP_VERIFICATION (USER_ID,OTP_TYPE,OTP_VALUE,CREATED_ON,REQUEST_ID) 
        VALUES  ('${userId}','${otpType}', '${otp}','${new Date().toISOString()}', '${request_id}');`;
        try {
            const r = await this.clickdb.exec({ query: insert });
            return true;
        } catch (error) {
            throw error;
        }
    }

    async sendOTP(email: string, fullName: string, userId: string, otpType: string) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        //save the otp against the user first 

        const payload = {
            "from": {
                "address": "info@timepayonline.com",
                "name": "evok timepay"
            },
            "to": [
                {
                    "email_address": {
                        "address": email,
                        "name": fullName,
                    }
                }
            ],
            "subject": "Email Verification",
            "htmlbody": "<div><b> Your OTP for Email Verification is " + otp + ".  </b></div>"
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': this.configSvc.get('zohoKey')
        }

        const { data } = await firstValueFrom(
            this.http.post('https://api.zeptomail.in/v1.1/email', payload, { headers }).pipe(
                catchError((error: AxiosError) => {
                    this.logger.error(error.response.data);
                    throw 'An error happened!';
                }),
            ),
        );

        if (data.data && data.data[0].code == 'EM_104') {
            const encOTP = await this.encSvc.encrypt(otp.toString());
            await this.saveOTP(userId, encOTP, otpType, data.request_id);
        } else {
            throw 'An error encountered while sending otp!';
        }
        return data;
    }

    async verifyOTP(userId: string, otp: string, otpType: string) {
        const query = `SELECT OTP_VALUE FROM OTP_VERIFICATION WHERE USER_ID = '${userId}' AND OTP_TYPE = '${otpType}';`;
        try {
            const r = await this.clickdb.query({ query: query });
            const jsonRes: any = await r.json();
            if (jsonRes.data.length === 0) {
                throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
            }
            else {
                //decrypt the otp
                const decryptedOTP = await this.encSvc.decrypt(jsonRes.data[0].OTP_VALUE);
                console.log('otp compare=>', decryptedOTP, otp);
                if (decryptedOTP === otp) {
                    await this.clickdb.exec({
                        query: `ALTER TABLE OTP_VERIFICATION UPDATE VERIFIED = true, VERIFIED_ON = '${new Date().toUTCString()}' 
                    WHERE USER_ID = '${userId}' AND OTP_TYPE = '${otpType}';`
                    });
                    return true;
                }
                else {
                    throw new HttpException('FAILED TO UPDATE VERIFICATION STATUS', HttpStatus.INTERNAL_SERVER_ERROR);
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
        }
        catch (error) {
            throw error;
        }
    }
}

