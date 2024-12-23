import type { ResponseLike } from "@huginn/shared";

export type ClientOptions = {
	rest?: Partial<RESTOptions>;
	cdn?: Partial<CDNOptions>;
	gateway?: Partial<GatewayOptions>;
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
	log: boolean;
	// TODO: Actually implement intents
	intents: number;
	createSocket(url: string): WebSocket;
};

export enum ClientReadyState {
	NONE = 0,
	INITIALIZING = 1,
	READY = 2,
	RECONNECRING = 3,
}
