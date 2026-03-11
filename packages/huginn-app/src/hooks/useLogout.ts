import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useNavigate } from "@tanstack/react-router";
import { useHuginnMutation } from "./useHuginnMutation";

export function useLogout() {
   const client = useClient();
   const navigate = useNavigate();
   const { resetScrolls } = useChannelStore();

   const mutation = useHuginnMutation({
      async mutationFn() {
         await client?.logout();
         await client?.gateway.waitForEvents(["disconnected"]);
         client?.gateway.connect();
      },
   });

   async function logout() {
      localStorage.removeItem("refresh-token");
      localStorage.removeItem("access-token");

      if (client?.voice.status !== "idle") {
         await client?.voiceManager.disconnectVoice();
      }

      await mutation.mutateAsync();
      await navigate({ to: "/login", replace: true, viewTransition: { types: ["backwards"] } });

      resetScrolls();
   }

   return logout;
}
