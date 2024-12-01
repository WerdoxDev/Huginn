import type { Snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { H3Error, createError } from "h3";
import { prisma } from "#database";

export class DBError extends Error {
	public constructor(
		public callerName: string,
		public type: DBErrorType,
		public cause?: string,
	) {
		super(`Unhandeled Database Error => ${callerName} => ${type}: ${cause ? `(${cause})` : ""}`, {
			cause: cause,
		});
	}

	isErrorType(type: DBErrorType) {
		return this.type === type;
	}
}

export function assertError(error: Error | null, type: DBErrorType) {
	let actualError = error;
	if (error instanceof H3Error) {
		actualError = error.cause as DBError;
	}

	return actualError && isDBError(actualError) && actualError.isErrorType(type);
}

export function assertId(methodName: string, ...ids: (Snowflake | undefined)[]) {
	let lastValidIndex = -1;
	try {
		for (const [i, id] of ids.entries()) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			BigInt(id!);
			lastValidIndex = i;
		}
	} catch (e) {
		throw createError({ cause: new DBError(methodName, DBErrorType.INVALID_ID, ids[lastValidIndex + 1]) });
	}
}

export function assertObj(methodName: string, obj: unknown, errorType: DBErrorType, cause?: string) {
	if (obj === null || typeof obj !== "object") {
		throw createError({ cause: new DBError(methodName, errorType, cause) });
	}
}

export function assertCondition(methodName: string, shouldAssert: boolean, errorType: DBErrorType, cause?: string) {
	if (shouldAssert) {
		throw createError({ cause: new DBError(methodName, errorType, cause) });
	}
}

export function isDBError(object: unknown): object is DBError {
	if (object !== null && typeof object === "object" && object instanceof DBError) {
		return true;
	}

	return false;
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

export enum DBErrorType {
	INVALID_ID = "INVALID_ID",
	NULL_USER = "NULL_USER",
	NULL_CHANNEL = "NULL_CHANNEL",
	NULL_MESSAGE = "NULL_MESSAGE",
	NULL_RELATIONSHIP = "NULL_RELATIONSHIP",
	NULL_READ_STATE = "NULL_READ_STATE",
}
