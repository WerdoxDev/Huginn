import type { RawFile } from "./rest-types";
import type { Snowflake } from "./snowflake";

export type HuginnErrorFieldInformation = {
	code: string;
	message: string;
};

export type HuginnErrorGroupWrapper = {
	_errors: HuginnErrorFieldInformation[];
};

export type HuginnError = Record<string, HuginnErrorGroupWrapper>;

export type HuginnErrorData = {
	code: number;
	errors?: HuginnError;
	message: string;
};

export type RequestBody = {
	files: RawFile[] | undefined;
	json: unknown | undefined;
};

export function isErrorResponse(error: unknown): error is HuginnErrorFieldInformation {
	return typeof Reflect.get(error as Record<string, unknown>, "message") === "string";
}

export function isErrorGroupWrapper(error: unknown): error is HuginnErrorGroupWrapper {
	return Reflect.has(error as Record<string, unknown>, "_errors");
}

export enum HttpCode {
	OK = 200,
	CREATED = 201,
	NO_CONTENT = 204,
	NOT_MODIFIED = 304,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	METHOD_NOT_ALLOWED = 405,
	TOO_MANY_REQUESTS = 429,
	GATEWAY_UNAVAILABLE = 502,
	SERVER_ERROR = 500,
}

export enum JsonCode {
	NONE = 0,
	UNKNOWN_ACCOUNT = 10001,
	UNKNOWN_MESSAGE = 10002,
	UNKNOWN_MEMBER = 10003,
	UNKNOWN_USER = 10004,
	UNKNOWN_CHANNEL = 10005,
	UNKNOWN_RELATIONSHIP = 10006,
	INVALID_FORM_BODY = 20001,
	USERNAME_NOT_FOUND = 30001,
	RELATION_SELF_REQUEST = 30002,
	RELATION_EXISTS = 30003,
}

export enum GatewayCode {
	UNKNOWN = 4000,
	UNKNOWN_OPCODE = 4001,
	DECODE_ERROR = 4002,
	NOT_AUTHENTICATED = 4003,
	AUTHENTICATION_FAILED = 4004,
	ALREADY_AUTHENTICATED = 4005,
	INVALID_SEQ = 4006,
	SESSION_TIMEOUT = 4007,
	INVALID_INTENTS = 4008,
	INVALID_SESSION = 4009,
}

export enum FieldCode {
	REQUIRED = "REQUIRED",
	INVALID_LOGIN = "INVALID_LOGIN",
	WRONG_LENGHTH = "INCORRECT_LENGTH",
	USERNAME_TAKEN = "USERNAME_TAKEN",
	EMAIL_IN_USE = "EMAIL_IN_USE",
	EMAIL_INVALID = "EMAIL_INVALID",
	PASSWORD_INCORRECT = "PASSWORD_INCORRECT",
}

// Detailed errors that happen to a normal user
export const Fields = {
	required(): [string, string] {
		return ["This field is required", FieldCode.REQUIRED];
	},
	invalidLogin(): [string, string] {
		return ["Login or password is invalid", FieldCode.INVALID_LOGIN];
	},
	wrongLength(min?: number, max?: number): [string, string] {
		let text = "";
		if (max && min) text = `This should be between ${min}-${max} characters`;
		else if (min) text = text = `This must be atleast ${min} characters long`;
		else if (max) text = `This must be at most ${max} characters long`;
		else text = "This is invalid";
		return [text, FieldCode.WRONG_LENGHTH];
	},
	emailInvalid(): [string, string] {
		return ["Email is invalid", FieldCode.EMAIL_INVALID];
	},
	emailInUse(): [string, string] {
		return ["Email is already registered", FieldCode.EMAIL_IN_USE];
	},
	usernameTaken(): [string, string] {
		return ["Username is already taken", FieldCode.USERNAME_TAKEN];
	},
	passwordIncorrect(): [string, string] {
		return ["Password is incorrect", FieldCode.PASSWORD_INCORRECT];
	},
};

// Mostly api related errors. Users will very rarely see these
export const Errors = {
	unauthorized(): [string, JsonCode] {
		return ["Unauthorized", JsonCode.NONE];
	},
	serverError(): [string, JsonCode] {
		return ["Server Error", JsonCode.NONE];
	},
	fileNotFound(): [string, JsonCode] {
		return ["File Not Found", JsonCode.NONE];
	},
	invalidFileFormat(): [string, JsonCode] {
		return ["Invalid File Format", JsonCode.NONE];
	},
	malformedBody(): [string, JsonCode] {
		return ["Malformed Body", JsonCode.NONE];
	},
	websocketFail(): [string, JsonCode] {
		return ["Websocket Upgrade Failed", JsonCode.NONE];
	},
	invalidFormBody(): [string, JsonCode] {
		return ["Invalid Form Body", JsonCode.INVALID_FORM_BODY];
	},
	unknownUser(userId?: Snowflake): [string, JsonCode] {
		return [`Unknown User (${userId})`, JsonCode.UNKNOWN_USER];
	},
	unknownChannel(channelId?: Snowflake): [string, JsonCode] {
		return [`Unknown Channel (${channelId})`, JsonCode.UNKNOWN_CHANNEL];
	},
	unknownMessage(messageId?: Snowflake): [string, JsonCode] {
		return [`Unknown Message (${messageId})`, JsonCode.UNKNOWN_MESSAGE];
	},
	unknownRelationship(relationshipId?: Snowflake): [string, JsonCode] {
		return [`Unknown Relationship (${relationshipId})`, JsonCode.UNKNOWN_RELATIONSHIP];
	},
	noUserWithUsername(): [string, JsonCode] {
		return ["No user with specified username was found", JsonCode.USERNAME_NOT_FOUND];
	},
	relationshipSelfRequest(): [string, JsonCode] {
		return ["Cannot send friend request to self", JsonCode.RELATION_SELF_REQUEST];
	},
	relationshipExists(): [string, JsonCode] {
		return ["You are already friends with this user", JsonCode.RELATION_EXISTS];
	},
};
