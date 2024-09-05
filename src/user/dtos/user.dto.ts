export class User {
  public userId?: string;
  public fullName?: string;
  public email: string;
  public password: string;
  public mobile: string;
  public lastLoggedIn?: string;
  public blocked?: boolean;
  public failedAttempt?: number;
  public createdOn?: string;
  public disabled?: boolean;
  public passwordResetDate?: string;
  public roles: string[];
}

// ? schema for the user table
// * CREATE TABLE USER (USER_ID String, FULL_NAME String, EMAIL String, MOBILE String, PASSWORD String,
// * LAST_LOGGED_IN String, BLOCKED String, FAILED_ATTEMPT String, CREATED_ON DateTime, DISABLED String, PASSWORD_RESET_DATE DateTime)
// * ENGINE = ReplacingMergeTree()
// * ORDER BY USER_ID
