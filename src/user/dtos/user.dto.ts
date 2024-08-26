export interface User {
    userId?: string;
    firstName: string;
    lastName: string;
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