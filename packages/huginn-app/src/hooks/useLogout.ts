import { useClient } from "@stores/apiStore";
import { useChannelStore } from "@stores/channelStore";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useHuginnMutation } from "./useHuginnMutation";

export function useLogout() {
   const queryClient = useQueryClient();
   const client = useClient();
   const navigate = useNavigate();
   const { resetScrolls } = useChannelStore();

   const mutation = useHuginnMutation({
      async mutationFn() {
         await client.logout();
         client.gateway.connect();
      },
   });

   async function logout() {
      localStorage.removeItem("refresh-token");
      localStorage.removeItem("access-token");

      if (client.voice.connectionInfo) {
         client.gateway.disconnectVoice();
      }

      await mutation.mutateAsync();
      await navigate("/login", { replace: true, viewTransition: true });

      resetScrolls();
      queryClient.removeQueries({ queryKey: ["channels"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      queryClient.removeQueries({ queryKey: ["relationships"] });
   }

   return logout;
}
