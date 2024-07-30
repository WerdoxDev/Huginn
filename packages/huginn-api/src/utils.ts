import { ResponseLike } from "@huginn/shared";
import { TokenPayload } from "@huginn/shared";
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

export function isBufferLike(value: unknown): value is ArrayBuffer | Buffer | Uint8Array | Uint8ClampedArray {
   return value instanceof ArrayBuffer || value instanceof Uint8Array || value instanceof Uint8ClampedArray;
}
