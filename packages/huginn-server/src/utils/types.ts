import type { APIEmbed, APIThumbnail, APIUser, GatewayIdentifyProperties } from "@huginn/shared";

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
