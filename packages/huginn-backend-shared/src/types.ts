import type { APIEmbed, APIPostAttachmentJSONBody, APIThumbnail, APIVideo, Snowflake, UserPresence, WorkerID } from "@huginn/shared";

export enum DBErrorType {
   INVALID_ID = "INVALID_ID",
   NULL_USER = "NULL_USER",
   NULL_CHANNEL = "NULL_CHANNEL",
   NULL_MESSAGE = "NULL_MESSAGE",
   NULL_MESSAGE_PIN = "NULL_MESSAGE_PIN",
   NULL_RELATIONSHIP = "NULL_RELATIONSHIP",
   NULL_READ_STATE = "NULL_READ_STATE",
   NULL_SETTINGS = "NULL_SETTINGS",
   NULL_KNOWN_APPLICATION = "NULL_KNOWN_APPLICATION",
   NULL_EMAIL_VERIFICATION = "NULL_EMAIL_VERIFICATION",
}

export enum CDNErrorType {
   FILE_NOT_FOUND = "FILE_NOT_FOUND",
   INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT",
}

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

export type ServerUserPresence = Omit<UserPresence, "user"> & { userId: Snowflake };

export type DBCall = { endedTimestamp?: Date; participants: Snowflake[] };

export type WebsocketOptions = {
   workerId: WorkerID;
   sessionDeleteTimeout: number;
};

export type CommonPayload = {
   op: number;
   d?: unknown;
   t?: string;
   s?: number;
};

declare module "crossws" {
   interface PeerContext {
      sessionId: Snowflake;
   }
}

export type VideoData = {
   width: number;
   height: number;
};

export type ImageData = {
   width: number;
   height: number;
};
