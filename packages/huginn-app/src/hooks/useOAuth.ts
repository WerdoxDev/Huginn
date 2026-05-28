import type { OAuthFlow, OAuthResult, OAuthType } from "@huginn/shared";

import { listenEvent } from "@lib/event-handler";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useRef } from "react";

export function useOAuth() {
   const client = useClient();
   const navigate = useNavigate();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();
   const posthog = usePostHog();
   const canceled = useRef(false);

   async function startOAuth(type: OAuthType) {
      if (!client) return;
      canceled.current = false;

      posthog.capture("oauth:oauth_flow_start", { type: type });

      const redirectUrl = import.meta.env.VITE_PUBLIC_OAUTH_REDIRECT;
      const url = client.oauth.getOAuthURL(type, huginnWindow.environment === "desktop" ? "desktop" : "browser", `${redirectUrl}`);
      console.log(url);

      updateModals({
         info: {
            status: "info",
            isOpen: true,
            title: "Check your browser!",
            text: "Please check your browser and continue there",
            isClosable: false,
            action: {
               cancel: {
                  text: "Cancel",
                  callback: () => {
                     canceled.current = true;
                     updateModals({ info: { isOpen: false } });
                  },
               },
            },
         },
      });

      if (huginnWindow.environment !== "desktop") {
         window.open(url, "_blank");
      } else {
         window.electronAPI.openExternal(url);
      }

      const result = await waitForOauth();
      // If client has already authenticated once, just set the tokens to the new ones.
      if (client.currentUser) {
         if (result && result.access_token) client.tokenHandler.token = result?.access_token;
         if (result && result.refresh_token) client.tokenHandler.refreshToken = result?.refresh_token;
      }

      return result;
   }

   async function waitForOauth() {
      const unlisten = listenEvent("deep_link", async (url) => {
         const actualUrl = new URL(url);
         console.log("Received deep link:", actualUrl);
         if (actualUrl.host !== "oauth-confirm" && actualUrl.pathname !== "/redirect") return;
         const flow = actualUrl.searchParams.get("flow")! as OAuthFlow;
         const oauth_token = actualUrl.searchParams.get("oauth_token") ?? undefined;
         const access_token = actualUrl.searchParams.get("access_token") ?? undefined;
         const refresh_token = actualUrl.searchParams.get("refresh_token") ?? undefined;
         localStorage.setItem(
            "oauth-confirm",
            JSON.stringify({
               flow,
               oauth_token,
               access_token,
               refresh_token,
            } satisfies OAuthResult),
         );

         unlisten();
      });

      const result = await new Promise<OAuthResult | null>((res) => {
         const interval = window.setInterval(() => {
            if (canceled.current === true) {
               clearInterval(interval);
               res(null);
            }

            const oauth = localStorage.getItem("oauth-confirm");
            if (oauth) {
               localStorage.removeItem("oauth-confirm");
               clearInterval(interval);
               updateModals({ info: { isOpen: false } });

               const value = JSON.parse(oauth);
               res(value);
            }
         }, 500);
      });

      return result;
   }

   return startOAuth;
}
