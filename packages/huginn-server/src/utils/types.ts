import type {
	APIEmbed,
	APIPostAttachmentJSONBody,
	APIThumbnail,
	APIUser,
	APIVideo,
	GatewayIdentifyProperties,
	IdentityTokenPayload,
	TokenPayload,
} from "@huginn/shared";
import type { Attachment } from "@prisma/client";
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

export type DBEmbed = Omit<APIEmbed, "thumbnail" | "video"> & { thumbnail?: DBThumbnail; video?: DBVideo };
export type DBThumbnail = Required<APIThumbnail>;
export type DBVideo = Required<APIVideo>;

export type DBAttachment = Omit<APIPostAttachmentJSONBody, "id"> & {
	contentType: string;
	size: number;
	url: string;
	height?: number;
	width?: number;
	flags: number;
};

declare module "hono" {
	interface ContextVariableMap {
		tokenPayload: TokenPayload;
		identityTokenPayload: IdentityTokenPayload;
		token: string;
		session: Session;
	}
}
