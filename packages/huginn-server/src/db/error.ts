import { Prisma } from "@prisma/client";
import { Snowflake } from "@huginn/shared";

export class DBError<T extends Error> extends Error {
   public constructor(
      public error: T,
      methodName: string,
      cause?: string,
   ) {
      super(
         `Unhandeled Database Error => ${methodName} => ${error.name}: ${error.message} ${
            error.cause ? `(${error.cause as string})` : ""
         }`,
         {
            cause,
         },
      );
      this.flattenError(this.error);
   }

   isErrorType(type: DBErrorType) {
      if (this.error instanceof Error) {
         return (this.error.message as DBErrorType) === type;
      }
   }

   flattenError(error: unknown) {
      if (error instanceof DBError) {
         this.error = error.error;
         this.flattenError(error.error);
      }
   }
}

export function assertId(methodName: string, ...ids: Snowflake[]) {
   try {
      for (const id of ids) BigInt(id);
   } catch (e) {
      throw new DBError(Error(DBErrorType.INVALID_ID, { cause: "Provided ID was not BigInt compatible" }), methodName);
   }
}

export function assertObj(methodName: string, obj: unknown, errorType: DBErrorType, cause?: string): asserts obj {
   if (obj === null || typeof obj !== "object") {
      throw new DBError(Error(errorType, { cause: cause }), methodName);
   }
}

export function assertCondition(methodName: string, shouldAssert: boolean, errorType: DBErrorType, cause?: string) {
   if (shouldAssert) {
      throw new DBError(Error(errorType, { cause: cause }), methodName);
   }
}

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
   INVALID_ID = "INVALID_ID",
   NULL_USER = "NULL_USER",
   NULL_CHANNEL = "NULL_CHANNEL",
   NULL_MESSAGE = "NULL_MESSAGE",
   NULL_RELATIONSHIP = "NULL_RELATIONSHIP",
}
