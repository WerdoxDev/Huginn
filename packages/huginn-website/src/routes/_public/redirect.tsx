import { HuginnButton, HuginnIcon } from "@huginn/frontend-shared";
import { OAuthCode } from "@huginnjs/shared";
import { useTheme } from "@stores/themeStore";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/_public/redirect")({
   component: RedirectComponent,
});

type RedirectResult = {
   kind: "success" | "error" | "cancelled" | "invalid";
   flow?: "browser" | "desktop";
   title: string;
   description: string;
   payload?: {
      handoff_code: string | null;
      flow: "browser" | "desktop";
      oauth_token: string | null;
      connected: string | null;
      error: string | null;
   };
   deepLink?: string;
};

const errorMessages: Record<string, { title: string; description: string }> = {
   [OAuthCode.CANCELLED]: {
      title: "Connection cancelled",
      description: "You cancelled the request. No changes were made. Return to Huginn whenever you're ready to try again.",
   },
   [OAuthCode.ACCOUNT_ALREADY_CONNECTED]: {
      title: "Account already in use",
      description: "This Google account is already connected to another Huginn account. Choose a different Google account and try again.",
   },
   [OAuthCode.PROVIDER_ALREADY_CONNECTED]: {
      title: "Google already connected",
      description: "A different Google account is already connected to your Huginn account. Disconnect it in Huginn before connecting this one.",
   },
   [OAuthCode.LINK_EXPIRED]: {
      title: "Connection session expired",
      description: "This account connection request has expired. Return to Huginn and start a new request.",
   },
};

function readRedirectResult(): RedirectResult {
   if (typeof window === "undefined") {
      return { kind: "invalid", title: "Checking connection", description: "Reading your sign-in result…" };
   }

   const params = new URLSearchParams(window.location.search);
   const originalSearch = window.location.search;
   const flow = params.get("flow");
   if (flow !== "browser" && flow !== "desktop") {
      return {
         kind: "invalid",
         title: "This link is incomplete",
         description: "The sign-in response is missing its destination. Return to Huginn and start again.",
      };
   }

   const error = params.get("error");
   const handoffCode = params.get("handoff_code");
   const oauthToken = params.get("oauth_token");
   const connected = params.get("connected");

   if (!error && !connected && !oauthToken && !handoffCode) {
      return {
         kind: "invalid",
         title: "This link is incomplete",
         description: "The sign-in response is missing the information Huginn needs. Return to Huginn and start again.",
      };
   }

   const payload: NonNullable<RedirectResult["payload"]> = {
      handoff_code: handoffCode,
      flow,
      oauth_token: oauthToken,
      connected,
      error,
   };
   const deepLink = "huginn://oauth-confirm" + originalSearch;

   if (error) {
      const knownError = errorMessages[error.toUpperCase()];
      const providerDescription = params.get("error_description")?.trim().slice(0, 240) || undefined;
      const readableError = /^[a-z][a-z0-9_-]{0,79}$/i.test(error)
         ? error
              .replace(/[_-]+/g, " ")
              .toLowerCase()
              .replace(/^./, (letter) => letter.toUpperCase())
         : "The provider could not complete the request";

      return {
         kind: error.toUpperCase() === OAuthCode.CANCELLED ? "cancelled" : "error",
         flow,
         title: knownError?.title ?? "Could not connect to Huginn",
         description: knownError?.description ?? providerDescription ?? readableError + ". Return to Huginn and try again.",
         payload,
         deepLink,
      };
   }

   return {
      kind: "success",
      flow,
      title: connected === "google" ? "Google is connected" : connected ? "Account connected" : oauthToken ? "Almost there" : "Welcome back",
      description: connected
         ? "Your account is connected. Head back to Huginn and carry on."
         : oauthToken
           ? "Head back to Huginn to finish making your space your own."
           : "Your conversations are waiting. Return to Huginn to pick up where you left off.",
      payload,
      deepLink,
   };
}

function RedirectComponent() {
   const [result] = useState(readRedirectResult);
   const [storageFailed, setStorageFailed] = useState(false);
   const linkRef = useRef<HTMLAnchorElement | null>(null);
   const { themeType } = useTheme();

   const storeBrowserResult = () => {
      if (!result.payload) return;
      try {
         localStorage.setItem("oauth-confirm", JSON.stringify(result.payload));
         setStorageFailed(false);
      } catch {
         setStorageFailed(true);
      }
   };

   useEffect(() => {
      // remove browser history
      window.history.replaceState(window.history.state, "", window.location.pathname);
      if (result.flow === "browser") {
         storeBrowserResult();
      } else if (result.flow === "desktop") {
         linkRef.current?.click();
      }
   }, [result]);

   const isError = storageFailed || result.kind === "error" || result.kind === "invalid";
   const isCancelled = !storageFailed && result.kind === "cancelled";
   const title = storageFailed ? "Couldn't return to Huginn" : result.title;
   const description = storageFailed ? "Your browser blocked saving the sign-in result. Allow site storage, then try again." : result.description;
   const helpText = storageFailed
      ? "Keep this window open until the result reaches Huginn."
      : result.flow === "desktop"
        ? "If Huginn didn't open, use the button above. You can close this tab afterward."
        : result.flow === "browser"
          ? "If this window stays open, switch back to Huginn."
          : "Close this tab and start again in Huginn.";
   const actionClassName =
      "flex h-10 w-full items-center justify-center rounded-md px-4 font-medium text-white transition-colors duration-150 focus-visible:outline-none";

   return (
      <div className="flex min-h-dvh flex-1 items-center justify-center px-4 py-8">
         <div className="bg-surface flex w-full max-w-96 flex-col items-center rounded-lg p-5 text-center shadow-xl">
            {isError || isCancelled ? (
               <div className={isError ? "bg-negative-700 rounded-full p-2.5" : "bg-surface-alt rounded-full p-2.5"}>
                  <div className={isError ? "bg-negative-500 rounded-full p-2.5" : "bg-caution-500 rounded-full p-2.5"}>
                     <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-7 text-white"
                     >
                        <circle cx="12" cy="12" r="9" />
                        {isCancelled ? <path d="M8 12h8" /> : <path d="M12 7v6m0 4h.01" />}
                     </svg>
                  </div>
               </div>
            ) : (
               <HuginnIcon
                  themeType={themeType}
                  className="size-20 animate-pulse transition-all hover:scale-105 hover:-rotate-12 active:rotate-6"
                  thickOutlined
               />
            )}

            <div className="text-text mt-4 text-2xl font-medium">{title}</div>
            <div className="text-text/70 mt-2 text-sm leading-5">{description}</div>

            {result.flow && (
               <div className="mt-5 w-full">
                  {storageFailed ? (
                     <HuginnButton type="button" color="primary" onClick={storeBrowserResult} className={actionClassName}>
                        Try again
                     </HuginnButton>
                  ) : result.flow === "desktop" ? (
                     <a ref={linkRef} href={result.deepLink} className={`bg-primary-700 hover:bg-primary-800 active:bg-primary-900 ${actionClassName}`}>
                        Open Huginn
                     </a>
                  ) : (
                     <HuginnButton type="button" color="primary" onClick={() => window.close()} className={actionClassName}>
                        Return to Huginn
                     </HuginnButton>
                  )}
                  <div className="text-text/70 mt-3 text-sm leading-5">{helpText}</div>
               </div>
            )}

            {!result.flow && <div className="text-text/70 mt-5 text-sm leading-5">{helpText}</div>}
         </div>
      </div>
   );
}
