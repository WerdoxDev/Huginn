import { ResponseLike } from "@shared/rest-types";

export type ClientOptions = {
   // TODO: Actually implement intents
   intents: number;
   rest?: Partial<RESTOptions>;
   gateway?: Partial<GatewayOptions>;
};

export type RESTOptions = {
   api: string;
   authPrefix: "Bearer";
   makeRequest(url: string, init: RequestInit): Promise<ResponseLike>;
};

export type GatewayOptions = {
   url: string;
   identify: boolean;
   log: boolean;
   createSocket(url: string): WebSocket;
};

export enum ClientReadyState {
   NONE,
   INITIALIZING,
   READY,
}
