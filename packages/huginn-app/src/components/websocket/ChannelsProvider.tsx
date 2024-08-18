import { useClient } from "@contexts/apiContext";
import { APIGetUserChannelsResult } from "@huginn/shared";
import { GatewayDMChannelCreateData } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ReactNode, useEffect } from "react";

export default function ChannelsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const router = useRouter();

   function onChannelCreated(d: GatewayDMChannelCreateData) {
      queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], data =>
         data && !data.some(x => x.id === d.id) ? [d, ...data] : data,
      );
      console.log(d);
   }

   function onChannelDeleted(d: GatewayDMChannelCreateData) {
      if (router.state.location.pathname.includes(d.id)) {
         navigate({ to: "/channels/@me", replace: true });
      }

      queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], data => data?.filter(x => x.id !== d.id));
      console.log(d);
   }

   useEffect(() => {
      client.gateway.on("channel_create", onChannelCreated);
      client.gateway.on("channel_delete", onChannelDeleted);

      return () => {
         client.gateway.off("channel_create", onChannelCreated);
         client.gateway.off("channel_delete", onChannelDeleted);
      };
   }, []);

   return props.children;
}
