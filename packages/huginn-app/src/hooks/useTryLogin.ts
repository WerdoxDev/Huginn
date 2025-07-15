import { useHistory } from "@contexts/historyContext";
import { useClient, useClientStore } from "@stores/clientStore";
import { useCallback } from "react";
import type { To } from "react-router";
import { useInitializeClient } from "./useInitializeClient";

export function useTryLogin() {
   const client = useClient();
   const clientStore = useClientStore();
   const history = useHistory();
   const initializeClient = useInitializeClient();

   const tryLogin = useCallback(async (options: { onFound?: () => void, onNotFound?: () => void, onSuccessful?: () => Promise<void> | void, onError?: (e: unknown) => void, navigatePath?: To }) => {
      if (!clientStore.isInitialized) {
         return;
      }

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
            localStorage.removeItem("refresh-token");
            localStorage.removeItem("access-token");
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
   }, [clientStore.isInitialized])

   return tryLogin;
}
