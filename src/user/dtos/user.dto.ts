
export class User {
    userId?: string;
    fullName?: string;
    email: string;
    password: string;
    mobile: string;
    lastLoggedIn?: String;
    blocked?: boolean;
    failedAttempt?: number;
    createdOn?: string;
    disabled?: boolean;
    passwordResetDate?: string;
    roles: string[];
}