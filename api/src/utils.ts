import { ResponseLike } from "@shared/rest-types";
import { TokenPayload } from "@shared/api-types";
import * as jose from "jose";
import { DefaultGatewayOptions } from "./gateway/constants";
import { DefaultRestOptions } from "./rest/rest-utils";
import { ClientOptions } from "./types";

export function parseResponse(response: ResponseLike): Promise<unknown> {
   if (response.headers.get("Content-Type")?.startsWith("application/json")) {
      return response.json();
   }

   return response.arrayBuffer();
}

export function decodeToken(token: string): [boolean, (TokenPayload & jose.JWTPayload) | null] {
   try {
      const jwt = jose.decodeJwt<TokenPayload>(token);

      return [true, jwt];
   } catch (e) {
      return [false, null];
   }
}

export function createDefaultClientOptions(): ClientOptions {
   return {
      rest: { ...DefaultRestOptions },
      gateway: { ...DefaultGatewayOptions },
      intents: 0,
   };
}
