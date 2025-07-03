// import { usePostHog } from "posthog-js/react";
import { log } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useThisUser } from "@stores/userStore";
import { type To, useNavigate } from "react-router";

export function useInitializeClient() {
   const client = useClient();
   const store = useThisUser();
   const navigate = useNavigate();
   // const posthog = usePostHog();

   async function initialize(options: { token?: string, refreshToken?: string, navigatePath?: To, onSuccessful?: () => Promise<void> | void }): Promise<{ status: boolean, retryable: boolean }> {
      try {
         log("app:api-client", "default", "initialize start", "t:", options.token, "rt:", options.refreshToken);

         if (options.token || options.refreshToken) {
            const result = await client.initializeWithToken({ token: options.token, refreshToken: options.refreshToken });
            if (!result.status) {
               log("app:api-client", "default", "token initialize failed");

               return { status: false, retryable: result.retryable };
            }
         }

         const result = await Promise.race([
            client.gateway.authenticate(),
            new Promise<undefined>((res) => setTimeout(() => res(undefined), 10000))
         ]);

         log("app:api-client", "default", "initialize", "r:", result);

         // !result means it was timed out
         if (!result || !result.authenticated) {
            log("app:api-client", "default", "initialize failed. timed out", "r:", result);

            // If !result then it was just timed out. Meaning it's retryable. Otherwise what ever authenticate() returns
            return { status: false, retryable: result?.retryable !== undefined ? result.retryable : true };
         }

         store.setUser(client.user);

         localStorage.setItem("access-token", client.tokenHandler.token ?? "");
         localStorage.setItem("refresh-token", client.tokenHandler.refreshToken ?? "");

         // posthog.identify(client.user?.id, { username: client.user?.username, displayName: client.user?.displayName, email: client.user?.email });

         await options.onSuccessful?.();

         if (options.navigatePath) {
            await navigate(options.navigatePath, { viewTransition: true, replace: true, });
         }

         log("app:api-client", "default", "initialized");

         return { status: true, retryable: false };
      } catch (e) {
         log("app:api-client", "default", "initialize failed. caught");
         return { status: false, retryable: false };
      }
   }

   return initialize;
}
