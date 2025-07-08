import { useHistory } from "@contexts/historyContext";
import { HuginnAPIError } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import type { To } from "react-router";
import { useInitializeClient } from "./useInitializeClient";
import { useErrorHandler } from "./useServerErrorHandler";

export function useTryLogin() {
   const client = useClient();
   const history = useHistory();
   const initializeClient = useInitializeClient();
   const handleServerError = useErrorHandler();

   async function tryLogin(options: { onFound?: () => void, onNotFound?: () => void, onSuccessful?: () => Promise<void> | void, onError?: (e: unknown) => void, navigatePath?: To }) {
      if (client.gateway.status === "authenticated") return;

      const token = localStorage.getItem("access-token") ?? undefined;
      const refreshToken = localStorage.getItem("refresh-token") ?? undefined;

      if ((refreshToken || token) && history.lastPathname !== "/register") {
         options.onFound?.()

         let lastStatus: Awaited<ReturnType<typeof initializeClient>> | undefined;
         while (!lastStatus || (!lastStatus.status && lastStatus.retryable)) {
            lastStatus = await initializeClient({ token, refreshToken, navigatePath: options.navigatePath, onSuccessful: options.onSuccessful });
         }

         // If token is expired | gateway couldn't authenticate | client couldn't refresh token, basically token is invalid? delete. Network problem? RETRY!
         if (!lastStatus.retryable && !lastStatus.status) {
            // localStorage.removeItem("refresh-token");
            // localStorage.removeItem("access-token");
            options.onError?.(undefined);
            //TODO: Handle server error somehow
            // if (e instanceof HuginnAPIError && e.status >= 500) {
            //    handleServerError(e);
            // }
         }

         // posthog?.capture("logged_in_with_token");
      } else {
         options.onNotFound?.();
      }
   }

   return tryLogin;
}
