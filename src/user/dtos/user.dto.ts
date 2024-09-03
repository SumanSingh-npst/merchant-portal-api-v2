export class User {
  userId?: string;
  fullName?: string;
  email: string;
  password: string;
  mobile: string;
  lastLoggedIn?: string;
  blocked?: boolean;
  failedAttempt?: number;
  createdOn?: string;
  disabled?: boolean;
  passwordResetDate?: string;
  roles: string[];
}

// CREATE TABLE USER (USER_ID String, FULL_NAME String, EMAIL String, MOBILE String, PASSWORD String,
// LAST_LOGGED_IN String, BLOCKED String, FAILED_ATTEMPT String, CREATED_ON DateTime, DISABLED String, PASSWORD_RESET_DATE DateTime)
// ENGINE = ReplacingMergeTree()
// ORDER BY USER_ID
