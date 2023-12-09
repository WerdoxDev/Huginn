import { APIUser } from "@shared/api-types";
import { Snowflake } from "@shared/types";

export class DBError<T> extends Error {
   public constructor(
      public error: T,
      methodName: string,
      cause?: string,
   ) {
      super(`Unhandled error in ${methodName}! => ${error}`, { cause });
   }
}

export function assertUserIsDefined(user: unknown, id?: Snowflake): asserts user is APIUser {
   if (user === null || typeof user !== "object") {
      throw new Error(DBErrorType.NULL_USER, { cause: id });
   }
}

export function assertChannelIsDefined(channel: unknown): asserts channel is APIUser {
   if (channel === null || typeof channel !== "object") {
      throw new Error(DBErrorType.NULL_CHANNEL);
   }
}

export function isDBError(object: unknown): object is DBError<Error & { cause: string }> {
   if (object !== null && typeof object === "object") {
      return "error" in object;
   }

   return false;
}

export enum DBErrorType {
   NULL_USER = "NULL_USER",
   NULL_CHANNEL = "NULL_CHANNEL",
}
