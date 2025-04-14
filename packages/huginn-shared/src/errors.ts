import type { RawFile } from "./rest-types";
import type { Snowflake } from "./snowflake";

export type HuginnErrorFieldInformation = {
	code: string;
	message: string;
};

export type HuginnErrorGroupWrapper = {
	_errors: HuginnErrorFieldInformation[];
};

export type HuginnError = { [k: string]: HuginnErrorGroupWrapper | HuginnError };

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
	PARTIAL_CONTENT = 206,
	NOT_MODIFIED = 304,
	FOUND = 302,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	METHOD_NOT_ALLOWED = 405,
	TOO_MANY_REQUESTS = 429,
	GATEWAY_UNAVAILABLE = 502,
	NOT_IMPLEMENTED = 501,
	SERVER_ERROR = 500,
}

// 1001 - 1999 > Unknown Things
// 2000 - 2999 > Permission & Validation Things
// 3000 - 3999 > Request Related
export enum JsonCode {
	NONE = 0,
	UNKNOWN_ACCOUNT = 1001,
	UNKNOWN_MESSAGE = 1002,
	UNKNOWN_MEMBER = 1003,
	UNKNOWN_USER = 1004,
	UNKNOWN_CHANNEL = 1005,
	UNKNOWN_RELATIONSHIP = 1006,
	INVALID_FORM_BODY = 2001,
	MISSING_ACCESS = 2002,
	MISSING_PERMISSION = 2003,
	INVALID_CHANNEL_TYPE = 2004,
	INVALID_RECIPIENT = 2005,
	INVALID_ID = 2006,
	USERNAME_NOT_FOUND = 3001,
	RELATION_SELF_REQUEST = 3002,
	RELATION_EXISTS = 3003,
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
	INTENTIONAL_CLOSE = 4010,
}

export enum FieldCode {
	REQUIRED = "REQUIRED",
	SOFT_REQUIRED = "SOFT_REQUIRED",
	INVALID_LOGIN = "INVALID_LOGIN",
	WRONG_LENGHTH = "INCORRECT_LENGTH",
	USERNAME_TAKEN = "USERNAME_TAKEN",
	EMAIL_IN_USE = "EMAIL_IN_USE",
	EMAIL_INVALID = "EMAIL_INVALID",
	USERNAME_INVLIAD = "INVALID_USERNAME",
	PASSWORD_INCORRECT = "PASSWORD_INCORRECT",
}

export enum OAuthCode {
	CANCELLED = "CANCELLED",
}

// Detailed errors that happen to a normal user
export const Fields = {
	required(): [string, string] {
		return ["This field is required", FieldCode.REQUIRED];
	},
	softRequired(): [string, string] {
		return ["This field or one of the other fields is required", FieldCode.SOFT_REQUIRED];
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
	usernameInvalid(): [string, string] {
		return ["Username can only include numbers, letters, underlines _ and fullstops .", FieldCode.USERNAME_INVLIAD];
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
	forbidden(): [string, JsonCode] {
		return ["Forbidden", JsonCode.NONE];
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
	unknownUser(userId?: Snowflake | Snowflake[]): [string, JsonCode] {
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
	missingPermission(): [string, JsonCode] {
		return ["Missing Permissions", JsonCode.MISSING_PERMISSION];
	},
	missingAccess(): [string, JsonCode] {
		return ["Missing Access", JsonCode.MISSING_ACCESS];
	},
	invalidChannelType(): [string, JsonCode] {
		return ["Invalid Channel Type", JsonCode.INVALID_CHANNEL_TYPE];
	},
	invalidRecipient(recipientId: Snowflake): [string, JsonCode] {
		return [`Invalid Recipient (${recipientId})`, JsonCode.INVALID_RECIPIENT];
	},
	invalidId(id?: string): [string, JsonCode] {
		return [`"${id}" is not a valid Snowflake`, JsonCode.INVALID_ID];
	},
};
