import type { InitializationResult } from "@huginn/api";

import { analytics } from "@huginn/shared";
import { initNotifications } from "@lib/notification";
import { useClient } from "@stores/clientStore";
import { useStorage } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export function useInitializeClient() {
   const client = useClient();
   const store = useThisUser();
   const posthog = usePostHog();
   const clientInfo = useStorage("client-info");
   const navigate = useNavigate();
   const huginnWindow = useHuginnWindow();

   const initialize = useCallback(
      async (options: {
         token?: string;
         refreshToken?: string;
         navigatePath?: string;
         onSuccess?: () => Promise<void> | void;
      }): Promise<InitializationResult> => {
         return await analytics.startActiveSpan("initializeClient", async (span): Promise<InitializationResult> => {
            span.setAttributes({
               has_token: !!options.token,
               has_refresh_token: !!options.refreshToken,
               navigate_path: options.navigatePath ?? "none",
               client_null: !client,
            });

            try {
               if (!client) throw new Error("Client was undefined when initializing");

               const result = await client.initialize({
                  tokens: { token: options.token, refreshToken: options.refreshToken },
               });

               span.addEvent("initialize", { result_status: result.status, retryable: result.retryable, success: result.success });

               if (!result.success) {
                  return result;
               }

               store.setUser(client?.currentUser);

               span.setAttribute("user.id", client?.currentUser?.id ?? "none");

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

               const token = await initNotifications();
               if (token && huginnWindow.deviceId) {
                  await client?.auth.sendNotificationToken({ token, deviceId: huginnWindow.deviceId });
                  analytics.log({
                     body: "notification token sent",
                     attributes: { tokenLength: token.length, deviceId: huginnWindow.deviceId },
                     level: "info",
                  });
               }
               await options.onSuccess?.();

               if (options.navigatePath) {
                  console.log("LETS NAVIGATE");
                  await navigate({
                     to: options.navigatePath,
                     viewTransition: { types: ["forwards"] },
                     replace: true,
                  });
               }

               return result;
            } catch (e) {
               analytics.log({
                  body: "client initialization error",
                  level: "error",
                  exception: e,
               });
               return { status: "authentication_failed", retryable: false, success: false };
            } finally {
               span.end();
            }
         });
      },
      [client, store, posthog, navigate, clientInfo.id],
   );

   return initialize;
}
