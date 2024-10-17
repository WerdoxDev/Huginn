import { type ErrorFactory, createErrorFactory, unauthorized } from "@huginn/backend-shared";
import { Errors, HttpCode } from "@huginn/shared";
import { type H3Event, getHeader, setResponseStatus } from "h3";
import { type DBError, DBErrorType, prisma } from "#database";
import { verifyToken } from "./token-factory";

export async function useVerifiedJwt(event: H3Event) {
	const bearer = getHeader(event, "Authorization");

	if (!bearer) {
		throw unauthorized(event);
	}

	const token = bearer.split(" ")[1];

	const { valid, payload } = await verifyToken(token);

	if (!valid || !payload) {
		throw unauthorized(event);
	}

	if (!(await prisma.user.exists({ id: BigInt(payload.id) }))) {
		throw unauthorized(event);
	}

	return { payload, token };
}

export function handleCommonDBErrors(event: H3Event, error: DBError) {
	let errorFactory: ErrorFactory | undefined;

	if (error.isErrorType(DBErrorType.INVALID_ID)) {
		setResponseStatus(event, HttpCode.BAD_REQUEST);
		errorFactory = createErrorFactory(Errors.invalidId(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_USER)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownUser(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownRelationship(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_CHANNEL)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownChannel(error.cause));
	}
	if (error.isErrorType(DBErrorType.NULL_MESSAGE)) {
		setResponseStatus(event, HttpCode.NOT_FOUND);
		errorFactory = createErrorFactory(Errors.unknownMessage(error.cause));
	}

	return errorFactory;
}
