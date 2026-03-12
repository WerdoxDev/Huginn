import type { Snowflake } from "@huginn/shared";

import { Prisma, prisma } from "#database";
import { DBError, isDBError } from "#elysia-errors";
import { DBErrorType } from "#types";

export function assertError(error: Error | null, type: DBErrorType) {
   // let actualError = error;
   // if (error instanceof Error) {
   // 	actualError = error.cause as DBError;
   // }

   return error && isDBError(error) && error.isErrorType(type);
}

export function assertId(methodName: string, ...ids: (Snowflake | undefined)[]) {
   let lastValidIndex = -1;
   try {
      for (const [i, id] of ids.entries()) {
         BigInt(id!);
         lastValidIndex = i;
      }
      // oxlint-disable-next-line no-unused-vars
   } catch (e) {
      throw new DBError(methodName, DBErrorType.INVALID_ID, ids[lastValidIndex + 1]);
   }
}

export function assertObj<T>(methodName: string, obj: T, errorType: DBErrorType, cause?: string): asserts obj is NonNullable<T> {
   if (obj === null || typeof obj !== "object") {
      throw new DBError(methodName, errorType, cause);
   }
}

export function assertCondition(methodName: string, shouldThrow: boolean, errorType: DBErrorType, cause?: string) {
   if (shouldThrow) {
      throw new DBError(methodName, errorType, cause);
   }
}

export async function assertExists(
   error: unknown,
   methodName: string,
   errorType: DBErrorType,
   ids: (Snowflake | undefined)[] | { userId: Snowflake; channelId: Snowflake }[],
) {
   const normalIds = ids as Snowflake[];
   const readStateIds = ids as { userId: Snowflake; channelId: Snowflake }[];

   if (errorType === DBErrorType.NULL_USER) {
      await prisma.user.assertUsersExist(methodName, normalIds);
   } else if (errorType === DBErrorType.NULL_CHANNEL) {
      await prisma.channel.assertChannelsExist(methodName, normalIds);
   } else if (errorType === DBErrorType.NULL_MESSAGE) {
      await prisma.message.assertMessagesExist(methodName, normalIds);
   } else if (errorType === DBErrorType.NULL_RELATIONSHIP) {
      await prisma.relationship.assertRelationshipsExist(methodName, normalIds);
   } else if (errorType === DBErrorType.NULL_READ_STATE) {
      await prisma.readState.assertReadStatesExist(methodName, readStateIds);
   }
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
