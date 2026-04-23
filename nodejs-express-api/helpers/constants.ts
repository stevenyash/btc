export const AccountVerified = "Verified";

export const AccountNotVerified = "Not Verified";

export const AccountActive = "Active";

export const AccountPending = "Pending";

export const RecordNotFound = "Record not found";

export const BadRequest = "Bad Request";

export const AccessForbbiden = "Access Forbidden";

export const UnauthorizedAccess = "Unauthorized Access";

export const ServerError = "Error processing requesting...";

export const ErrorMessages = {
  AccountVerified,
  AccountNotVerified,
  AccountActive,
  AccountPending,
  RecordNotFound,
  BadRequest,
  AccessForbbiden,
  UnauthorizedAccess,
  ServerError,
} as const;

export type ErrorMessage = typeof ErrorMessages[keyof typeof ErrorMessages];