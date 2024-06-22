import { useClient } from "@contexts/apiContext";
import { Snowflake } from "@shared/snowflake";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";

export function useRemoveChannel(skipNavigation?: boolean) {
   const client = useClient();
   const router = useRouter();
   const navigate = useNavigate();

   const mutation = useMutation({
      async mutationFn(channelId: Snowflake) {
         if (router.state.location.pathname.includes(channelId) && !skipNavigation) {
            await navigate({ to: "/channels/@me" });
         }

         await client.channels.removeDm(channelId);
      },
   });

   async function removeChannel(channelId: Snowflake) {
      await mutation.mutateAsync(channelId);
   }

   return removeChannel;
}
