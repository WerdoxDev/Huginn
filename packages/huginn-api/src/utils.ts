import type { ResponseLike, TokenPayload } from "@huginn/shared";
import * as jose from "jose";
import type { CDNOptions, GatewayOptions, RESTOptions, VoiceOptions } from "./types";

export function decodeToken(token: string): [boolean, (TokenPayload & jose.JWTPayload) | null] {
	try {
		const jwt = jose.decodeJwt<TokenPayload>(token);

		return [true, jwt];
	} catch (e) {
		return [false, null];
	}
}

export const defaultClientOptions = {
	rest: {
		api: "https://midgard.huginn.dev/api",
		authPrefix: "Bearer",
		makeRequest(url, init) {
			return defaultMakeRequest(url, init);
		},
	} as RESTOptions,
	cdn: { url: "https://midgard.huginn.dev" } as CDNOptions,
	gateway: { url: "wss://midgard.huginn.dev/gateway", log: false, intents: 0 } as GatewayOptions,
	voice: { url: "wss://midgard.huginn.dev/voice" } as VoiceOptions,
} as const;

export async function defaultMakeRequest(url: string, init: RequestInit): Promise<ResponseLike> {
	const response = await fetch(url, init);

	return {
		body: response.body,
		async arrayBuffer() {
			return response.arrayBuffer();
		},
		async json() {
			return response.json();
		},
		async text() {
			return response.text();
		},
		get bodyUsed() {
			return response.bodyUsed;
		},
		headers: response.headers,
		status: response.status,
		statusText: response.statusText,
		ok: response.status >= 200 && response.status < 300,
	};
}
