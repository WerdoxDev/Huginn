import type { ErrorFactory } from "@huginn/backend-shared";

import { prisma } from "@huginn/backend-shared/database";
import { CONSTANTS, type APIEmbed } from "@huginn/shared";
import { Fields } from "@huginn/shared";

export function validateEmail(email: string | undefined, errorObject: ErrorFactory) {
   if (email && !email.match(CONSTANTS.EMAIL_REGEX)) {
      errorObject.addError("email", Fields.emailInvalid());
      return false;
   }
   if (email === null || email === "") {
      errorObject.addError("email", Fields.required());
   }

   return true;
}

export function validateUsername(username: string | undefined, errorObject: ErrorFactory) {
   const [minLen, maxLen] = [CONSTANTS.USERNAME_MIN_LENGTH, CONSTANTS.USERNAME_MAX_LENGTH];

   if (username && (username.length < minLen || username.length > maxLen)) {
      errorObject.addError("username", Fields.wrongLength(minLen, maxLen));
      return false;
   }
   if (username && !username?.match(CONSTANTS.USERNAME_REGEX)) {
      errorObject.addError("username", Fields.usernameInvalid());
      return false;
   }
   if (username === null || username === "") {
      errorObject.addError("username", Fields.required());
   }

   return true;
}

export function validateDisplayName(displayName: string | undefined | null, errorObject: ErrorFactory) {
   const [minLen, maxLen] = [CONSTANTS.DISPLAY_NAME_MIN_LENGTH, CONSTANTS.DISPLAY_NAME_MAX_LENGTH];

   if (displayName && (displayName.length < minLen || displayName.length > maxLen)) {
      errorObject.addError("displayName", Fields.wrongLength(minLen, maxLen));
      return true;
   }

   return false;
}

export async function validateCorrectPassword(inputPassword: string | undefined, hashPassword: string | null, errorObject: ErrorFactory) {
   if (inputPassword && hashPassword) {
      const valid = await Bun.password.verify(inputPassword, hashPassword);

      if (!valid) {
         errorObject.addError("password", Fields.passwordIncorrect());
         return false;
      }
   }

   return true;
}

export function validatePassword(password: string | undefined, errorObject: ErrorFactory, fieldName = "password") {
   if (password && password.length < CONSTANTS.PASSWORD_MIN_LENGTH) {
      errorObject.addError(fieldName, Fields.wrongLength(CONSTANTS.PASSWORD_MIN_LENGTH));
      return false;
   }

   return true;
}

export async function validateEmailUnique(email: string | undefined, errorObject: ErrorFactory) {
   if (!email) {
      return true;
   }

   if (await prisma.user.exists({ email: email })) {
      errorObject.addError("email", Fields.emailInUse());
      return false;
   }

   return true;
}

export async function validateUsernameUnique(username: string | undefined, errorObject?: ErrorFactory) {
   if (!username) {
      return true;
   }

   if (await prisma.user.exists({ username: username })) {
      errorObject?.addError("username", Fields.usernameTaken());
      return false;
   }

   return true;
}

export async function validateChannelName(channelName: string | undefined | null, errorObject?: ErrorFactory) {
   if (!channelName) {
      return true;
   }

   if (channelName.length > CONSTANTS.CHANNEL_NAME_MAX_LENGTH) {
      errorObject?.addError("name", Fields.wrongLength(undefined, CONSTANTS.CHANNEL_NAME_MAX_LENGTH));
      return false;
   }

   return false;
}

export function validateEmbeds(embeds: APIEmbed[], errorObject: ErrorFactory) {
   for (const [i, embed] of embeds.entries()) {
      if (embed.type === "rich" && !embed.title && !embed.description && !embed.thumbnail) {
         errorObject.addError(`embeds.${i}.title`, Fields.softRequired());
         errorObject.addError(`embeds.${i}.description`, Fields.softRequired());
         errorObject.addError(`embeds.${i}.thumbnail`, Fields.softRequired());
         return false;
      }
      if (embed.type === "rich" && embed.url && !embed.title) {
         errorObject.addError(`embeds.${i}.title`, Fields.required());
         return false;
      }
      if (embed.type === "image" && !embed.url) {
         errorObject.addError(`embeds.${i}.url`, Fields.required());
         return false;
      }
      if (embed.type === "image" && !embed.thumbnail) {
         errorObject.addError(`embeds.${i}.thumbnail`, Fields.required());
         return false;
      }

      if (embed.type === "video" && !embed.url) {
         errorObject.addError(`embeds.${i}.url`, Fields.required());
         return false;
      }
      if (embed.type === "video" && !embed.video) {
         errorObject.addError(`embeds.${i}.video`, Fields.required());
         return false;
      }
   }

   return true;
}
