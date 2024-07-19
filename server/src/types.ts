import { APIUser } from "@shared/api-types";

export type ServerGatewayOptions = {
   logHeartbeat: boolean;
};

export type ClientSessionInfo = {
   sessionId: string;
   user: APIUser;
};

export type AppVersionInfo = {
   version: string;
   pub_date: string;
   url: string;
   signature: string;
   notes: string;
};
