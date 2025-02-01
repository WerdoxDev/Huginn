export enum DBErrorType {
	INVALID_ID = "INVALID_ID",
	NULL_USER = "NULL_USER",
	NULL_CHANNEL = "NULL_CHANNEL",
	NULL_MESSAGE = "NULL_MESSAGE",
	NULL_RELATIONSHIP = "NULL_RELATIONSHIP",
	NULL_READ_STATE = "NULL_READ_STATE",
}

export enum CDNErrorType {
	FILE_NOT_FOUND = "FILE_NOT_FOUND",
	INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT",
}

declare module "hono" {
	interface ContextVariableMap {
		id: string;
		startTime: number;
		waitUntilPromises?: (() => Promise<unknown>)[];
	}
}
