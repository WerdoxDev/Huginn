import { Snowflake } from "@shared/types";

export class DBError<T> extends Error {
   public constructor(
      public error: T,
      methodName: string,
      cause?: string,
   ) {
      super(`Unhandled error in ${methodName}! => ${error}`, { cause });
      this.flattenError(this.error);
   }

   isErrorType(type: DBErrorType) {
      if (this.error instanceof Error) {
         return this.error.message === type;
      }
   }

   flattenError(error: unknown) {
      if (error instanceof DBError) {
         this.error = error.error;
         this.flattenError(error.error);
      }
   }
}

export function assertUserIsDefined(user: unknown, id?: Snowflake): asserts user {
   if (user === null || typeof user !== "object") {
      throw new Error(DBErrorType.NULL_USER, { cause: id });
   }
}

export function assertChannelIsDefined(channel: unknown): asserts channel {
   if (channel === null || typeof channel !== "object") {
      throw new Error(DBErrorType.NULL_CHANNEL);
   }
}

export function assertMessageIsDefined(message: unknown): asserts message {
   if (message === null || typeof message !== "object") {
      throw new Error(DBErrorType.NULL_MESSAGE);
   }
}

export function isDBError(object: unknown): object is DBError<Error & { cause: string }> {
   if (object !== null && typeof object === "object" && object instanceof DBError && object.error instanceof Error) {
      return true;
   }

   return false;
}

export enum DBErrorType {
   NULL_USER = "NULL_USER",
   NULL_CHANNEL = "NULL_CHANNEL",
   NULL_MESSAGE = "NULL_MESSAGE",
}
