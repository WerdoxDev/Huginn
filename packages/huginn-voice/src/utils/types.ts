import type { APIUser } from "@huginn/shared";

export type ClientSessionInfo = {
	token: string;
	user: APIUser;
};
