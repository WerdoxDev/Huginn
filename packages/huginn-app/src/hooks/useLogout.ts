import { analytics } from "@huginnjs/shared";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { clearUserStore } from "@stores/userStore";
import { useNavigate } from "@tanstack/react-router";

import { useHuginnMutation } from "./useHuginnMutation";

export function useLogout() {
   const client = useClient();
   const navigate = useNavigate();
   const { resetScrolls } = useChannelStore();
   const { updateModals } = useModals();

   const logoutMutation = useHuginnMutation({
      async mutationFn() {
         const reset = client?.gateway.isConnected ? client.gateway.waitForAnyEvents(["reset"]) : undefined;
         if (reset) {
            await client?.logout();
            await reset;
         } else {
            await client?.logout();
            return;
         }

         await client?.gateway.connect();
      },
   });

   async function logout() {
      localStorage.removeItem("refresh-token");
      localStorage.removeItem("access-token");

      if (client?.voice.status !== "idle") {
         try {
            await client?.voiceManager.disconnectVoice();
         } catch {
            // Continue clearing the session if voice teardown fails after revocation.
         }
      }

      try {
         await logoutMutation.mutateAsync();
      } finally {
         clearUserStore();
         analytics.reset();
         updateModals({ settings: { isOpen: false }, info: { isOpen: false } });
         await navigate({ to: "/login", replace: true, viewTransition: { types: ["backwards"] } });

         resetScrolls();
      }
   }

   return logout;
}
