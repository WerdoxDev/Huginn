import { APIUser } from "@shared/api-types";

export class DBError<T> extends Error {
   public constructor(public error: T, methodName: string) {
      super(`Unhandled error in ${methodName}! => ${error}`);
   }
}

export function assertUserIsDefined(user: unknown): asserts user is APIUser {
   if (typeof user !== "object") {
      throw new Error(DBErrorType.NULL_USER);
   }
}

export function isDBError(object: unknown): object is DBError<Error> {
   if (object != null && typeof object === "object") {
      return "error" in object;
   }

   return false;
}

export enum DBErrorType {
   NULL_USER = "NULL_USER",
}
