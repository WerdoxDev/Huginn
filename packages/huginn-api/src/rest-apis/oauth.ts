import { type APIPostOAuthConfirmJSONBody, type APIPostOAuthConfirmResult, type APIPostOAuthHandoffResult, type OAuthFlow, type OAuthProvider, Routes } from "@huginnjs/shared";

import type { Gateway } from "../gateway";
import type { REST } from "../rest";

export class OAuthAPI {
   private readonly rest: REST;
   private readonly gateway: Gateway;

   public constructor(rest: REST, gateway: Gateway) {
      this.rest = rest;
      this.gateway = gateway;
   }

   public async confirmOAuth(body: APIPostOAuthConfirmJSONBody, identityToken: string): Promise<APIPostOAuthConfirmResult> {
      return this.rest.post(Routes.confirmOAuth(), {
         body,
         auth: true,
         token: identityToken,
      }) as Promise<APIPostOAuthConfirmResult>;
   }

   public async exchangeHandoff(code: string): Promise<APIPostOAuthHandoffResult> {
      return this.rest.post(Routes.oauthHandoff(), { body: { code } }) as Promise<APIPostOAuthHandoffResult>;
   }

   public getOAuthURL(type: OAuthProvider, flow: OAuthFlow, redirectUrl: string): string {
      const url = new URL(`/api/auth/${type}`, this.rest.options?.api);
      url.searchParams.set("flow", flow);
      url.searchParams.set("redirect_url", redirectUrl);
      return url.toString();
   }

   public getConnectOAuthURL(type: OAuthProvider, flow: OAuthFlow, redirectUrl: string, linkToken: string): string {
      const url = new URL(this.getOAuthURL(type, flow, redirectUrl));
      url.searchParams.set("link_token", linkToken);
      return url.toString();
   }
}
