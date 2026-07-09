import type { HuginnClient } from "../";

export function makeClient(token: string | undefined = "test-token"): HuginnClient {
   return {
      currentUser: { id: "u-test" },
      tokenHandler: { token },
   } as HuginnClient;
}
