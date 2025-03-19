import type { APIUser } from "@huginn/shared";

export type ClientSessionInfo = {
	sessionId: string;
	token: string;
	user: APIUser;
};
