import type {
   APIEmbed,
   APIPostAttachmentJSONBody,
   APIThumbnail, APIVideo, OAuthTokenPayload,
   Snowflake,
   UserTokenPayload
} from "@huginn/shared";
import type { Session } from "hono-sessions";

export type ServerGatewayOptions = {
   logHeartbeat: boolean;
};

export type ClientSessionState = "unauthenticated" | "authenticated";

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
      tokenPayload: UserTokenPayload;
      identityTokenPayload: OAuthTokenPayload;
      token: string;
      session: Session;
   }
}

declare module "crossws" {
   interface PeerContext {
      sessionId: Snowflake;
   }
}
