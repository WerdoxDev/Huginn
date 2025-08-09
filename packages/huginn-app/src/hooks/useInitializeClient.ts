// import { usePostHog } from "posthog-js/react";
import { error, log } from "@huginn/shared";
import { useClient, useClientStore } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";
import { type To, useNavigate } from "react-router";

export function useInitializeClient() {
   const client = useClient();
   const clientStore = useClientStore();
   const store = useThisUser();
   const posthog = usePostHog();
   const navigate = useNavigate();

   const initialize = useCallback(
      async (options: {
         token?: string;
         refreshToken?: string;
         navigatePath?: To;
         onSuccessful?: () => Promise<void> | void;
      }): Promise<{ status: boolean; retryable: boolean }> => {
         if (!clientStore.isInitialized) {
            return { status: false, retryable: true };
         }

         try {
            log("app:client-store", "default", "initialize start", "t:", options.token, "rt:", options.refreshToken);

            if (options.token || options.refreshToken) {
               const result = await client?.initializeWithToken({ token: options.token, refreshToken: options.refreshToken });
               if (!result?.status) {
                  log("app:client-store", "default", "token initialize failed");

                  return { status: false, retryable: result?.retryable ?? true };
               }
            }

            const result = await Promise.race([
               client?.gateway.authenticate(),
               new Promise<undefined>((res) => setTimeout(() => res(undefined), 10000)),
            ]);

            log("app:client-store", "default", "authenticate", "a:", result?.authenticated, "r:", result?.retryable);

            // !result means it was timed out
            if (!result || !result.authenticated) {
               log("app:client-store", "default", "initialize failed. timed out", "a:", result?.authenticated, "r:", result?.retryable);

               // If !result then it was just timed out. Meaning it's retryable. Otherwise what ever authenticate() returns
               return { status: false, retryable: result?.retryable !== undefined ? result.retryable : true };
            }

            store.setUser(client?.user);

            localStorage.setItem("access-token", client?.tokenHandler.token ?? "");
            localStorage.setItem("refresh-token", client?.tokenHandler.refreshToken ?? "");

            posthog.identify(client?.user?.id, {
               username: client?.user?.username,
               displayName: client?.user?.displayName,
               email: client?.user?.email,
            });

            await options.onSuccessful?.();

            if (options.navigatePath) {
               await navigate(options.navigatePath, { viewTransition: true, replace: true });
            }

            log("app:client-store", "default", "initialized");

            return { status: true, retryable: false };
         } catch (e) {
            error("app:client-store", "Failed to initialize", e);

            log("app:client-store", "default", "initialize failed. caught");

            return { status: false, retryable: false };
         }
      },
      [clientStore.isInitialized],
   );

   return initialize;
}
