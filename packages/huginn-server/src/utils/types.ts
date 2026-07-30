import type { APIEmbed, APIPostAttachmentJSONBody, APIThumbnail, APIVideo, Snowflake } from "@huginnjs/shared";

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

export type DBEmbed = Omit<APIEmbed, "thumbnail" | "video"> & {
   thumbnail?: DBThumbnail;
   video?: DBVideo;
};
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

export type TwitchOAuthResult = { access_token: string; expires_in: number };
export type IGDBSearchResult = {
   id: number;
   name: string;
   rating: number;
   url: string;
   alternative_names?: Array<{ name: string }>;
};

declare module "crossws" {
   interface PeerContext {
      sessionId: Snowflake;
   }
}
