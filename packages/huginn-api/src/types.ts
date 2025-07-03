import type { ResponseLike } from "@huginn/shared";

export type ClientOptions = {
   rest?: Partial<RESTOptions>;
   cdn?: Partial<CDNOptions>;
   gateway?: Partial<GatewayOptions>;
   voice?: Partial<VoiceOptions>;
};

export type RESTOptions = {
   api: string;
   authPrefix: "Bearer";
   makeRequest(url: string, init: RequestInit): Promise<ResponseLike>;
};

export type CDNOptions = {
   url: string;
};

export type GatewayOptions = {
   url: string;
   // TODO: Actually implement intents
   intents: number;
   createSocket(url: string): WebSocket;
};

export type VoiceOptions = {
   url: string;
   createSocket(url: string): WebSocket;
};
