import type { ResponseLike } from "@huginn/shared";

export type ClientOptions = {
	// TODO: Actually implement intents
	intents: number;
	rest?: Partial<RESTOptions>;
	gateway?: Partial<GatewayOptions>;
};

export type RESTOptions = {
	api: string;
	cdn: string;
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
	NONE = 0,
	INITIALIZING = 1,
	READY = 2,
}
