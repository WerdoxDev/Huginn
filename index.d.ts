import { APIUser } from "@shared/api-types";

type ServerGatewayOptions = {
   logHeartbeat: boolean;
};

type ClientSessionInfo = {
   sessionId: string;
   user: APIUser;
};

type AppVersionInfo = {
   version: string;
   pub_date: string;
   url: string;
   signature: string;
   notes: string;
};
