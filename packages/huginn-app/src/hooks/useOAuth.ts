import { type OAuthFlow, type OAuthResult, type OAuthProvider } from "@huginnjs/shared";
import { listenEvent } from "@lib/event-handler";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import * as jose from "jose";
import { usePostHog } from "posthog-js/react";
import { useRef } from "react";

export function useOAuth() {
   const client = useClient();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();
   const posthog = usePostHog();
   const canceled = useRef(false);

   async function startOAuth(provider: OAuthProvider, options?: { reauthenticationFor?: string; linkToken?: string; openedWindow?: Window | null }) {
      if (!client) return;
      canceled.current = false;
      const signedInUserId = client.currentUser?.id;

      posthog.capture("oauth:oauth_flow_start", { provider });

      const redirectUrl = import.meta.env.VITE_PUBLIC_OAUTH_REDIRECT;
      const flow: OAuthFlow = huginnWindow.environment === "browser" ? "browser" : "desktop";
      const url = options?.linkToken
         ? client.oauth.getConnectOAuthURL(provider, flow, `${redirectUrl}`, options.linkToken)
         : client.oauth.getOAuthURL(provider, flow, `${redirectUrl}`);

      updateModals({
         info: {
            status: "info",
            isOpen: true,
            title: options?.reauthenticationFor ? "Confirm your identity" : "Check your browser!",
            text: options?.reauthenticationFor
               ? `To ${options.reauthenticationFor}, complete ${provider === "google" ? "Google" : "GitHub"} sign-in in the other window. Return to Huginn when finished, or cancel here if you did not complete it.`
               : "Please check your browser and continue there",
            isClosable: false,
            action: {
               cancel: {
                  text: "Cancel",
                  callback: () => {
                     canceled.current = true;
                     options?.openedWindow?.close();
                     updateModals({ info: { isOpen: false } });
                  },
               },
            },
         },
      });

      if (huginnWindow.environment !== "desktop") {
         if (options?.openedWindow && !options?.openedWindow.closed) options.openedWindow.location.href = url;
         else window.open(url, "_blank");
      } else {
         window.electronAPI.openExternal(url);
      }

      const result = await waitForOauth();
      // if (result?.error === OAuthCode.EMAIL_IN_USE) {
      //    updateModals({
      //       info: {
      //          isOpen: true,
      //          status: "error",
      //          title: "Email already in use",
      //          text: "An account already uses this email. Sign in with your existing method, then connect Google in Settings.",
      //       },
      //    });
      //    return null;
      // }
      if (result?.handoff_code) {
         try {
            const tokens = await client.oauth.exchangeHandoff(result.handoff_code);
            const tokenUserId = jose.decodeJwt(tokens.token).id;
            const currentUserId = client.currentUser?.id;
            if (
               typeof tokenUserId !== "string" ||
               (signedInUserId && (tokenUserId !== signedInUserId || currentUserId !== signedInUserId)) ||
               (currentUserId && tokenUserId !== currentUserId)
            ) {
               updateModals({
                  info: {
                     isOpen: true,
                     status: "error",
                     title: "Wrong account",
                     text: "This sign-in does not match the account currently open in Huginn. Please try again with that account.",
                  },
               });
               return null;
            }
            client.tokenHandler.setTokens(tokens);
         } catch {
            updateModals({
               info: {
                  isOpen: true,
                  status: "error",
                  title: "Could not complete sign-in",
                  text: "You were redirected correctly but Huginn failed to sign you in. Please try again.",
               },
            });
            return null;
         }
      } else if (result?.error) {
         updateModals({
            info: {
               isOpen: true,
               status: "error",
               title: "Could not complete OAuth flow",
               text: "Please refer to the error message on the redirect page for more information, or try again.",
            },
         });
         return null;
      }

      return result;
   }

   async function waitForOauth() {
      const unlisten = listenEvent("deep_link", async (url) => {
         const actualUrl = new URL(url);
         if (actualUrl.protocol !== "huginn:" || actualUrl.host !== "oauth-confirm") return;
         const flow = actualUrl.searchParams.get("flow")! as OAuthFlow;
         const oauth_token = actualUrl.searchParams.get("oauth_token") ?? undefined;
         const handoff_code = actualUrl.searchParams.get("handoff_code") ?? undefined;
         const connected = (actualUrl.searchParams.get("connected") ?? undefined) as OAuthProvider | undefined;
         const error = actualUrl.searchParams.get("error") ?? undefined;
         localStorage.setItem(
            "oauth-confirm",
            JSON.stringify({
               flow,
               oauth_token,
               handoff_code,
               connected,
               error,
            } satisfies OAuthResult),
         );

         unlisten();
      });

      const result = await new Promise<OAuthResult | null>((res) => {
         const interval = window.setInterval(() => {
            if (canceled.current === true) {
               clearInterval(interval);
               unlisten();
               res(null);
               return;
            }

            const oauth = localStorage.getItem("oauth-confirm");
            if (oauth) {
               localStorage.removeItem("oauth-confirm");
               clearInterval(interval);
               unlisten();
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
