import { constants } from "@huginn/shared";
import { Field } from "@huginn/shared";
import { ErrorFactory } from "@huginn/backend-shared/src/error-factory";
import { prisma } from "./db";

export function validateEmail(email: string | undefined, errorObject: ErrorFactory) {
   if (email && !email.match(constants.EMAIL_REGEX)) {
      errorObject.addError("email", Field.emailInvalid());
      return false;
   } else if (email === null || email === "") {
      errorObject.addError("email", Field.required());
   }

   return true;
}

export function validateUsername(username: string | undefined, errorObject: ErrorFactory) {
   const [minLen, maxLen] = [constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH];

   if (username && (username.length < minLen || username.length > maxLen)) {
      errorObject.addError("username", Field.wrongLength(minLen, maxLen));
      return false;
   } else if (username === null || username === "") {
      errorObject.addError("username", Field.required());
   }

   return true;
}

export function validateDisplayName(displayName: string | undefined | null, errorObject: ErrorFactory) {
   const [minLen, maxLen] = [constants.DISPLAY_NAME_MIN_LENGTH, constants.DISPLAY_NAME_MAX_LENGTH];

   if (displayName && (displayName.length < minLen || displayName.length > maxLen)) {
      errorObject.addError("displayName", Field.wrongLength(minLen, maxLen));
      return true;
   }

   return false;
}

export function validateCorrectPassword(password: string | undefined, correctPassword: string, errorObject: ErrorFactory) {
   if (password && password !== correctPassword) {
      errorObject.addError("password", Field.passwordIncorrect());
      return false;
   }

   return true;
}

export function validatePassword(password: string | undefined, errorObject: ErrorFactory) {
   if (password && password.length < constants.PASSWORD_MIN_LENGTH) {
      errorObject.addError("password", Field.wrongLength(constants.PASSWORD_MIN_LENGTH));
      return false;
   }

   return true;
}

export async function validateEmailUnique(email: string | undefined, errorObject: ErrorFactory) {
   if (!email) {
      return true;
   }

   if (await prisma.user.exists({ email: email })) {
      errorObject.addError("email", Field.emailInUse());
      return false;
   }

   return true;
}

export async function validateUsernameUnique(username: string | undefined, errorObject?: ErrorFactory) {
   if (!username) {
      return true;
   }

   if (await prisma.user.exists({ username: username })) {
      errorObject?.addError("username", Field.usernameTaken());
      return false;
   }

   return true;
}
