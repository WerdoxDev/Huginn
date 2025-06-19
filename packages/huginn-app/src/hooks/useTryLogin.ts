import { useHistory } from "@contexts/historyContext";
import { ClientReadyState } from "@huginn/api";
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
      if (client.readyState === ClientReadyState.INITIALIZING) return;

      const refreshToken = localStorage.getItem("refresh-token");
      try {
         if (refreshToken && history.lastPathname !== "/register") {
            options.onFound?.()

            await initializeClient({ refreshToken, navigatePath: options.navigatePath, onSuccessful: options.onSuccessful });

            // posthog?.capture("logged_in_with_token");
         } else {
            options.onNotFound?.();
         }
      } catch (e) {
         localStorage.removeItem("refresh-token");
         if (e instanceof HuginnAPIError && e.status >= 500) {
            handleServerError(e);
         }
         options.onError?.(e);
      }
   }

   return tryLogin;
}
