import type { APIEmbed, APIThumbnail, APIUser, GatewayIdentifyProperties, IdentityTokenPayload, TokenPayload } from "@huginn/shared";
import type { Session } from "hono-sessions";

export type ServerGatewayOptions = {
	logHeartbeat: boolean;
};

export type ClientSessionInfo = {
	sessionId: string;
	user: APIUser;
} & GatewayIdentifyProperties;

export type AppVersionInfo = {
	version: string;
	pub_date: string;
	url: string;
	signature: string;
	notes: string;
};

export type DBEmbed = Omit<APIEmbed, "thumbnail"> & { thumbnail?: DBThumbnail };
export type DBThumbnail = Required<APIThumbnail>;

declare module "hono" {
	interface ContextVariableMap {
		tokenPayload: TokenPayload;
		identityTokenPayload: IdentityTokenPayload;
		token: string;
		session: Session;
	}
}
