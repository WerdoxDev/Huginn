import type { GatewayOAuthRedirectData, OAuthType } from "@huginn/shared";
import { listenEvent } from "@lib/event-handler";
import { useClient } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

export function useOAuth() {
   const client = useClient();
   const navigate = useNavigate();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();

   const unlisten = useRef<() => void>(null);
   // let unlisten: () => void;

   // Websocket

   function startOAuth(type: OAuthType) {
      listenOAuth();
      const url = client.oauth.getOAuthURL(
         type,
         huginnWindow.environment === "browser" ? "browser" : "websocket",
         `${window.origin}/#/oauth-redirect`,
      );
      console.log(`${window.origin}/#/oauth-redirect`);

      if (huginnWindow.environment === "browser") {
         window.open(url, "_self");
      } else {
         updateModals({
            info: {
               status: "default",
               isOpen: true,
               title: "Check your browser!",
               text: "Please check your browser and continue there",
               closable: false,
               action: {
                  cancel: {
                     text: "Cancel",
                     callback: () => {
                        updateModals({ info: { isOpen: false } });
                        unlistenOAuth();
                     },
                  },
               },
            },
         });
         // openExternal
         window.electronAPI.openExternal(url);
      }
   }

   async function onOAuthRedirect(d: GatewayOAuthRedirectData) {
      window.electronAPI.showMain();
      window.electronAPI.focusMain();
      await navigate(`/oauth-redirect?${new URLSearchParams({ ...d }).toString()}`, { viewTransition: true });
      unlistenOAuth();
   }

   function listenOAuth() {
      unlistenOAuth();
      client.gateway.on("oauth_redirect", onOAuthRedirect);

      // Url scheme
      unlisten.current = listenEvent("deep_link", async (url) => {
         const actualUrl = new URL(url);
         //TODO: MIGRATION
         // await getCurrentWindow().requestUserAttention(UserAttentionType.Critical);
         await navigate(`/oauth-redirect?${actualUrl.searchParams.toString()}`, { viewTransition: true });
         unlistenOAuth();
      });
   }

   useEffect(() => {
      return () => {
         unlistenOAuth();
      };
   }, []);

   function unlistenOAuth() {
      unlisten.current?.();
      client.gateway.off("oauth_redirect", onOAuthRedirect);
   }

   return startOAuth;
}
