export class User {
  public readonly userId?: string;
  public readonly fullName?: string;
  public readonly email: string;
  public readonly password: string;
  public readonly mobile: string;
  public readonly lastLoggedIn?: string;
  public readonly blocked?: boolean;
  public readonly failedAttempt?: number;
  public readonly createdOn?: string;
  public readonly disabled?: boolean;
  public readonly passwordResetDate?: string;
  public readonly roles: string[];
}

// ? schema for the user table
// * CREATE TABLE USER (USER_ID String, FULL_NAME String, EMAIL String, MOBILE String, PASSWORD String,
// * LAST_LOGGED_IN String, BLOCKED String, FAILED_ATTEMPT String, CREATED_ON DateTime, DISABLED String, PASSWORD_RESET_DATE DateTime)
// * ENGINE = ReplacingMergeTree()
// * ORDER BY USER_ID
