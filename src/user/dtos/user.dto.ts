export class User {
  static readonly userId?: string;
  static readonly fullName?: string;
  static readonly email: string;
  static readonly password: string;
  static readonly mobile: string;
  static readonly lastLoggedIn?: string;
  static readonly blocked?: boolean;
  static readonly failedAttempt?: number;
  static readonly createdOn?: string;
  static readonly disabled?: boolean;
  static readonly passwordResetDate?: string;
  static readonly roles: string[];
}

// ? schema for the user table
// * CREATE TABLE USER (USER_ID String, FULL_NAME String, EMAIL String, MOBILE String, PASSWORD String,
// * LAST_LOGGED_IN String, BLOCKED String, FAILED_ATTEMPT String, CREATED_ON DateTime, DISABLED String, PASSWORD_RESET_DATE DateTime)
// * ENGINE = ReplacingMergeTree()
// * ORDER BY USER_ID
