import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './dtos/user.dto';

@Injectable()
export class UserService {

    constructor(
        @InjectClickHouse() private readonly clickdb: ClickHouseClient
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
        const query = `INSERT INTO USER (USER_ID, FIRST_NAME, LAST_NAME, EMAIL, MOBILE, PASSWORD, 
        LAST_LOGGED_IN,BLOCKED, FAILED_ATTEMPT, CREATED_ON, DISABLED, PASSWORD_RESET_DATE) 
        VALUES ('${user_id}','${user.firstName}','${user.lastName}','${user.email}','${user.mobile}','${user.password}',
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
                firstName: jsonRes.data[0].FIRST_NAME,
                lastName: jsonRes.data[0].LAST_NAME,
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
            for (const role of jsonRes2.data) {
                user.roles.push(role.ROLE_ID);
            }
            return user;
        } catch (error) {
            throw error;
        }

    }
}

