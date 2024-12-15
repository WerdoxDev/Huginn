import {
	type APIPostOAuthConfirmJSONBody,
	type APIPostOAuthConfirmResult,
	type OAuthFlow,
	type OAuthType,
	Routes,
	generateRandomString,
} from "@huginn/shared";
import { encodeBase64 } from "@std/encoding";
import type { Gateway } from "../client-gateway";
import type { REST } from "../rest";

export class OAuthAPI {
	private readonly rest: REST;
	private readonly gateway: Gateway;

	public constructor(rest: REST, gateway: Gateway) {
		this.rest = rest;
		this.gateway = gateway;
	}

	public async confirmOAuth(body: APIPostOAuthConfirmJSONBody, identityToken: string): Promise<APIPostOAuthConfirmResult> {
		return this.rest.post(Routes.confirmOAuth(), { body, auth: true, token: identityToken }) as Promise<APIPostOAuthConfirmResult>;
	}

	public getOAuthURL(type: OAuthType, flow: OAuthFlow, redirectUrl: string): string {
		if (type === "google") {
			const url = new URL("/api/auth/google", this.rest.options?.api);

			const state = encodeBase64(`${Date.now()}:${generateRandomString(16)}`);
			url.searchParams.set("state", state);
			url.searchParams.set("flow", flow);
			if (flow === "browser" && redirectUrl) {
				url.searchParams.set("redirect_url", redirectUrl);
			}
			if (flow === "websocket") {
				url.searchParams.set("peer_id", this.gateway.peerId ?? "");
			}

			return url.toString();
		}

		return "";
	}
}
