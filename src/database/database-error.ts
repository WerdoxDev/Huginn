import { Prisma } from "@prisma/client";

export class DBError<T> extends Error {
   public constructor(public error: T, methodName: string, cause?: string) {
      super(`Unhandeled Database Error => ${methodName} => ${error}`, { cause });
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

export function assertObjectWithCause(methodName: string, obj: unknown, errorType: DBErrorType, cause?: string): asserts obj {
   if (obj === null || typeof obj !== "object") {
      throw new DBError(Error(errorType, { cause: cause }), methodName);
   }
}

export function assertBoolWithCause(methodName: string, shouldAssert: boolean, errorType: DBErrorType, cause?: string) {
   if (shouldAssert) {
      throw new DBError(Error(errorType, { cause: cause }), methodName);
   }
}

// export function assertUserIsDefined(methodName: string, user: unknown, id?: Snowflake): asserts user {
//    if (user === null || typeof user !== "object") {
//       throw new DBError(Error(DBErrorType.NULL_USER, { cause: id }), methodName);
//    }
// }

// export function assertChannelIsDefined(methodName: string, channel: unknown, id?: Snowflake): asserts channel {
//    if (channel === null || typeof channel !== "object") {
//       throw new DBError(Error(DBErrorType.NULL_CHANNEL, { cause: id }), methodName);
//    }
// }

// export function assertMessageIsDefined(methodName: string, message: unknown, id?: Snowflake): asserts message {
//    if (message === null || typeof message !== "object") {
//       throw new DBError(Error(DBErrorType.NULL_MESSAGE, { cause: id }), methodName);
//    }
// }

// export function assertRelationshipIsDefined(methodName: string, relationship: unknown, id?: Snowflake): asserts relationship {
//    if (relationship === null || typeof relationship !== "object") {
//       throw new DBError(Error(DBErrorType.NULL_RELATIONSHIP, { cause: id }), methodName);
//    }
// }

export function isDBError(object: unknown): object is DBError<Error & { cause: string }> {
   if (object !== null && typeof object === "object" && object instanceof DBError && object.error instanceof Error) {
      return true;
   }

   return false;
}

export function isPrismaError(object: unknown): object is (
   | Prisma.PrismaClientKnownRequestError
   | Prisma.PrismaClientUnknownRequestError
   | Prisma.PrismaClientValidationError
) & {
   cause: string;
} {
   if (
      object !== null &&
      typeof object === "object" &&
      (object instanceof Prisma.PrismaClientKnownRequestError ||
         object instanceof Prisma.PrismaClientUnknownRequestError ||
         object instanceof Prisma.PrismaClientValidationError)
   ) {
      return true;
   }

   return false;
}

export enum DBErrorType {
   NULL_USER = "NULL_USER",
   NULL_CHANNEL = "NULL_CHANNEL",
   NULL_MESSAGE = "NULL_MESSAGE",
   NULL_RELATIONSHIP = "NULL_RELATIONSHIP",
}
