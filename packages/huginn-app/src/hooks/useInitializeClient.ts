// import { usePostHog } from "posthog-js/react";
import { useClient } from "@stores/apiStore";
import { useThisUser } from "@stores/userStore";
import { type To, useNavigate } from "react-router";

export function useInitializeClient() {
   const client = useClient();
   const store = useThisUser();
   const navigate = useNavigate();
   // const posthog = usePostHog();

   async function initialize(options: { token?: string, refreshToken?: string, navigatePath?: To, onSuccessful?: () => Promise<void> | void }) {
      if (options.token || options.refreshToken) {
         await client.initializeWithToken({ token: options.token, refreshToken: options.refreshToken });
      }

      await client.gateway.authenticate();

      store.setUser(client.user);

      localStorage.setItem("access-token", client.tokenHandler.token ?? "");
      localStorage.setItem("refresh-token", client.tokenHandler.refreshToken ?? "");

      // posthog.identify(client.user?.id, { username: client.user?.username, displayName: client.user?.displayName, email: client.user?.email });
      await options.onSuccessful?.();

      if (options.navigatePath) {
         await navigate(options.navigatePath, { viewTransition: true, replace: true, });
      }
   }

   return initialize;
}
