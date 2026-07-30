import {
   type APIPostOAuthConfirmJSONBody,
   type APIPostOAuthConfirmResult,
   generateRandomString,
   type OAuthFlow,
   type OAuthType,
   Routes,
} from "@huginnjs/shared";
import { base64 } from "@scure/base";

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

   public getOAuthURL(type: OAuthType, flow: OAuthFlow, redirectUrl: string): string {
      if (type === "google") {
         const url = new URL("/api/auth/google", this.rest.options?.api);

         const state = base64.encode(new TextEncoder().encode(`${Date.now()}:${generateRandomString(16)}`));
         url.searchParams.set("state", state);
         url.searchParams.set("flow", flow);
         url.searchParams.set("redirect_url", redirectUrl);

         return url.toString();
      }

      return "";
   }
}
