import type { HuginnClient } from "../huginn-client";

export function makeClient(token: string | undefined = "test-token"): HuginnClient {
   return {
      currentUser: { id: "user-me" },
      tokenHandler: { token },
      generateNonce: () => "test-nonce",
   } as HuginnClient;
}
