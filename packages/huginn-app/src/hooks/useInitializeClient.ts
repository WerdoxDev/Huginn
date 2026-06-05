// import { usePostHog } from "posthog-js/react";
import type { InitializationResult } from "@huginn/api";

import { analytics, error, log } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useStorage } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export function useInitializeClient() {
   const client = useClient();
   const store = useThisUser();
   const posthog = usePostHog();
   const clientInfo = useStorage("client-info");
   const navigate = useNavigate();

   const initialize = useCallback(
      async (options: {
         token?: string;
         refreshToken?: string;
         navigatePath?: string;
         onSuccess?: () => Promise<void> | void;
      }): Promise<InitializationResult> => {
         try {
            if (!client) throw new Error("Client was undefined when initializing");

            log("app:client-store", "default", "initialize start");

            const result = await client.initialize({
               tokens: { token: options.token, refreshToken: options.refreshToken },
            });

            log("app:client-store", "default", "initialize result:", result?.status);

            if (!result.success) {
               log("app:client-store", "default", "initialize failed:", result?.status);
               return result;
            }

            store.setUser(client?.currentUser);

            if (client.tokenHandler.token) {
               localStorage.setItem("access-token", client.tokenHandler.token);
            }
            if (client.tokenHandler.refreshToken) {
               localStorage.setItem("refresh-token", client.tokenHandler.refreshToken);
            }

            analytics.identify(client!.currentUser!.id, {
               userId: client?.currentUser?.id,
               username: client?.currentUser?.username,
               displayName: client?.currentUser?.displayName,
               email: client?.currentUser?.email,
            });

            await options.onSuccess?.();

            if (options.navigatePath) {
               await navigate({
                  to: options.navigatePath,
                  viewTransition: { types: ["forwards"] },
                  replace: true,
               });
            }

            log("app:client-store", "default", "initialize finished");
            return result;
         } catch (e) {
            error("app:client-store", "Failed to initialize", e);
            return { status: "authentication_failed", retryable: false, success: false };
         }
      },
      [client, store, posthog, navigate, clientInfo.id],
   );

   return initialize;
}
