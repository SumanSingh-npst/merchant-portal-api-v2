import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './dtos/user.dto';

@Injectable()
export class UserService {
  constructor(@InjectClickHouse() private readonly clickdb: ClickHouseClient) {}

  async create(user: User) {
    const userExists = await this.findOneByEmail(user.email);
    if (userExists) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const lastUser = await this.lastUser();
    const user_id = `u${parseInt(lastUser.userId.replace('u', '')) + 1}`;

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

    const rolesQuery = `INSERT INTO USER_ROLES (USER_ID, ROLE_ID) VALUES`;
    const values = user.roles
      .map((role) => `('${user_id}','${role}')`)
      .join(',');
    const finalRolesQuery = `${rolesQuery} ${values};`;
    try {
      await Promise.all([
        this.clickdb.exec({ query: query }),
        this.clickdb.exec({ query: finalRolesQuery }),
      ]);

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
        roles: [],
      };

      const rolesQuery = `SELECT ROLE_ID FROM USER_ROLES WHERE USER_ID = '${user.userId}';`;
      const r2 = await this.clickdb.query({ query: rolesQuery });

      const jsonRes2: any = await r2.json();

      const rolePromises = await jsonRes2.data.map(async (role) => {
        const r = await this.clickdb.query({
          query: `SELECT ROLE_NAME FROM ROLE WHERE ROLE_ID = '${role.ROLE_ID}';`,
        });
        const res = await r.json();
        return res.data[0];
      });

      const roles = await Promise.all(rolePromises);
      user.roles = roles.map((role) => role.ROLE_NAME);
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

  async lastUser() {
    try {
      const query = `SELECT FULL_NAME, CREATED_ON, USER_ID
                    FROM "USER"
                    ORDER BY CREATED_ON DESC
                    LIMIT 1`;
      const response = await this.clickdb.query({ query: query });
      const data: any = await response.json();
      return data.data.length > 0
        ? {
            name: data.data[0].FULL_NAME,
            createdOn: data.data[0].CREATED_ON,
            userId: data.data[0].USER_ID,
          }
        : {
            userId: 'u0',
          };
    } catch (error) {
      return { res: error, status: false, msg: 'error', statusCode: 500 };
    }
  }
}
