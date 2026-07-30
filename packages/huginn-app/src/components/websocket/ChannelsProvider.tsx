import type {
   GatewayDMCannelRecipientRemoveData,
   GatewayDMChannelCreateData,
   GatewayDMChannelDeleteData,
   GatewayDMChannelRecipientAddData,
   GatewayDMChannelUpdateData,
} from "@huginnjs/shared";

import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { getChannelComputedName } from "@lib/query-utils";
import { convertToAppDirectChannel } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { useReadStates } from "@stores/readStateStore";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

import type { AppDirectChannel } from "@/types";

export default function ChannelsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const currentChannel = useCurrentChannel();
   const navigate = useNavigate();
   const location = useLocation();
   const { addChannelToReadStates, removeChannelFromReadStates } = useReadStates();

   function onChannelCreated(d: GatewayDMChannelCreateData) {
      queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
         old && !old.some((x) => x.id === d.id) ? [convertToAppDirectChannel(d), ...old] : old,
      );
      addChannelToReadStates(d.id);
   }

   async function onChannelDeleted(d: GatewayDMChannelDeleteData) {
      queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) => old?.filter((x) => x.id !== d.id));

      if (currentChannel?.id === d.id) {
         await navigate({ to: "/channels/@me", replace: true });
      }

      removeChannelFromReadStates(d.id);
      queryClient.removeQueries({ queryKey: ["messages", d.id] });
   }

   function onChannelUpdated(d: GatewayDMChannelUpdateData) {
      queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
         old?.map((channel) => (channel.id === d.id ? convertToAppDirectChannel(d) : channel)),
      );
   }

   function onChannelRecipientAdded(d: GatewayDMChannelRecipientAddData) {
      queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
         old?.map((channel) => {
            if (channel.id !== d.channelId) {
               return channel;
            }

            const recipientIds = [...channel.recipientIds, d.user.id];
            return {
               ...channel,
               recipientIds,
               // This may not always work due to the new user "possibly" not being added to the list just yet
               name: getChannelComputedName(channel, recipientIds) ?? "unknown",
            };
         }),
      );
   }

   function onChannelRecipientRemoved(d: GatewayDMCannelRecipientRemoveData) {
      queryClient.setQueryData<AppDirectChannel[]>(["channels", "@me"], (old) =>
         old?.map((channel) => {
            if (channel.id !== d.channelId) {
               return channel;
            }

            const recipientIds = channel.recipientIds.filter((x) => x !== d.user.id);
            return {
               ...channel,
               recipientIds,
               name: getChannelComputedName(channel, recipientIds) ?? "unknown",
            };
         }),
      );
   }

   useEffect(() => {
      const unlisteners: Array<(() => void) | undefined> = [];

      unlisteners.push(client?.gateway.listen("channel_create", onChannelCreated));
      unlisteners.push(client?.gateway.listen("channel_update", onChannelUpdated));
      unlisteners.push(client?.gateway.listen("channel_delete", onChannelDeleted));
      unlisteners.push(client?.gateway.listen("channel_recipient_add", onChannelRecipientAdded));
      unlisteners.push(client?.gateway.listen("channel_recipient_remove", onChannelRecipientRemoved));

      return () => {
         for (const unlisten of unlisteners) {
            unlisten?.();
         }
      };
   }, [location.href]);

   return props.children;
}
