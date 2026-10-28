import type { HuginnClient } from "../huginn-client";

export function makeClient(token: string | undefined = "test-token"): HuginnClient {
   return {
      currentUser: { id: "user-me" },
      tokenHandler: {
         token,
         ensureValidToken() {
            return Promise.resolve(!!this.token);
         },
      },
      generateNonce: () => "test-nonce",
   } as HuginnClient;
}
