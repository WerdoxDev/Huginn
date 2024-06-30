import { useClient } from "@contexts/apiContext";
import { APIGetUserChannelsResult } from "@shared/api-types";
import { GatewayDMChannelCreateDispatchData, GatewayDispatchEvents } from "@shared/gateway-types";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ReactNode, useEffect } from "react";

export default function ChannelsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const navigate = useNavigate();
   const router = useRouter();

   function onChannelCreated(d: GatewayDMChannelCreateDispatchData) {
      queryClient.setQueryData(["channels", "@me"], (data: APIGetUserChannelsResult) =>
         !data.some((x) => x.id === d.id) ? [d, ...data] : data,
      );
      console.log(d);
   }

   function onChannelDeleted(d: GatewayDMChannelCreateDispatchData) {
      if (router.state.location.pathname.includes(d.id)) {
         navigate({ to: "/channels/@me", replace: true });
      }

      queryClient.setQueryData(["channels", "@me"], (data: APIGetUserChannelsResult) => data?.filter((x) => x.id !== d.id));
      console.log(d);
   }

   useEffect(() => {
      client.gateway.on(GatewayDispatchEvents.DM_CHANNEL_CREATE, onChannelCreated);
      client.gateway.on(GatewayDispatchEvents.DM_CHANNEL_DELETE, onChannelDeleted);

      return () => {
         client.gateway.off(GatewayDispatchEvents.DM_CHANNEL_CREATE, onChannelCreated);
         client.gateway.off(GatewayDispatchEvents.DM_CHANNEL_DELETE, onChannelDeleted);
      };
   }, []);

   return props.children;
}
