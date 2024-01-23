import { APIUser } from "@shared/api-types";

type ServerGatewayOptions = {
   logHeartbeat: boolean;
};

type ClientSessionInfo = {
   sessionId: string;
   user: APIUser;
};
