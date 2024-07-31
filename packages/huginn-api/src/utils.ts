import { ResponseLike } from "@huginn/shared";
import { TokenPayload } from "@huginn/shared";
import * as jose from "jose";
import { DefaultGatewayOptions } from "./gateway/constants";
import { DefaultRestOptions } from "./rest/rest-utils";
import { ClientOptions } from "./types";

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
