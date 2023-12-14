import { constants } from "@shared/constants";
import { ErrorFactory } from "./factory/error-factory";
import { Field } from "@shared/errors";
import { DatabaseUser } from "./database";

export function validateEmail(email: string | undefined, errorObject: ErrorFactory) {
   if (email && !email.match(constants.EMAIL_REGEX)) {
      errorObject.error("email", Field.emailInvalid());
      return false;
   }

   return true;
}

export function validateUsername(username: string | undefined, errorObject: ErrorFactory) {
   const [minLen, maxLen] = [constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH];

   if (username && (username.length < minLen || username.length > maxLen)) {
      errorObject.error("username", Field.wrongLength(minLen, maxLen));
      return false;
   }

   return true;
}

export function validateDisplayName(displayName: string | undefined, errorObject: ErrorFactory) {
   const [minLen, maxLen] = [constants.DISPLAY_NAME_MIN_LENGTH, constants.DISPLAY_NAME_MAX_LENGTH];

   if (displayName && (displayName.length < minLen || displayName.length > maxLen)) {
      errorObject.error("displayName", Field.wrongLength(minLen, maxLen));
      return true;
   }

   return false;
}

export function validateCorrectPassword(password: string | undefined, correctPassword: string, errorObject: ErrorFactory) {
   if (password && password !== correctPassword) {
      errorObject.error("password", Field.passwordIncorrect());
      return false;
   }

   return true;
}

export function validatePassword(password: string | undefined, errorObject: ErrorFactory) {
   if (password && password.length < constants.PASSWORD_MIN_LENGTH) {
      errorObject.error("password", Field.wrongLength(constants.PASSWORD_MIN_LENGTH));
      return false;
   }

   return true;
}

export async function validateEmailUnique(email: string | undefined, errorObject: ErrorFactory) {
   if (!email) {
      return true;
   }

   if (await DatabaseUser.existsInUsers("email", email)) {
      errorObject.error("email", Field.emailInUse());
      return false;
   }

   return true;
}

export async function validateUsernameUnique(username: string | undefined, errorObject?: ErrorFactory) {
   if (!username) {
      return true;
   }

   if (await DatabaseUser.existsInUsers("username", username)) {
      errorObject?.error("username", Field.usernameTaken());
      return false;
   }

   return true;
}
