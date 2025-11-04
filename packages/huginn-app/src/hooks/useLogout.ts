import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useNavigate } from "react-router";
import { useHuginnMutation } from "./useHuginnMutation";

export function useLogout() {
   const client = useClient();
   const navigate = useNavigate();
   const { resetScrolls } = useChannelStore();

   const mutation = useHuginnMutation({
      async mutationFn() {
         await client?.logout();
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
      await navigate("/login", { replace: true, viewTransition: true });

      resetScrolls();
   }

   return logout;
}
