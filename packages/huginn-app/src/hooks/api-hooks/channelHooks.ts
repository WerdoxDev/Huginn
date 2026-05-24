import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { ChannelType, type DirectChannel, type Snowflake } from "@huginn/shared";
import { getChannelsOptions } from "@lib/queries";
import { findChannel } from "@lib/query-utils";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";

import type { AppDirectChannel, AppUser } from "@/types";

import { useUsers } from "./userHooks";

export function useChannel(channelId?: Snowflake, guildId = "@me") {
   const client = useClient();
   const { data } = useQuery(getChannelsOptions(client!, guildId));

   return useMemo(() => findChannel(data, channelId), [data, channelId]);
}

// export function useChannelName(channelId?: Snowflake): string {
//    const channel = useChannel(channelId);
//    const recipients = useUsers(channel?.recipientIds);

//    return useMemo(() => getChannelName(channel?.name, recipients), [channelId, recipients, channel]);
// }

export function useChannelNamePlaceholder(recipients: AppUser[]) {
   return useMemo(() => recipients.map((x) => x.displayName).join(", "), [recipients]);
}

export function useChannelRecipients(channelId?: Snowflake, _guildId?: Snowflake) {
   const channel = useChannel(channelId);
   const recipients = useUsers(channel?.recipientIds);

   return { recipients, ownerId: channel?.type === ChannelType.GROUP_DM ? channel?.ownerId : undefined };
}

export function useCurrentChannel() {
   const { channelId } = useParams({ strict: false });

   const channel = useChannel(channelId);
   return channel;

   // return useMemo(() => channels?.find((channel) => channel.id === channelId), [channelId, channels]);
}

export function useSafeDeleteDMChannel(channelId?: Snowflake, channelType?: DirectChannel["type"], channelName?: string) {
   const mutation = useDeleteDMChannel();
   const { updateModals } = useModals();

   function tryMutate() {
      if (!channelId) return;
      if (channelType === ChannelType.GROUP_DM) {
         updateModals({
            info: {
               isOpen: true,
               isClosable: true,
               title: `Leaving "${channelName}"`,
               status: "info",
               text: `Are you sure you want to leave ${channelName}? You cannot enter the group unless you are invited again.`,
               action: {
                  confirm: {
                     text: "Leave Group",
                     callback: async () => {
                        await mutation.mutateAsync(channelId);
                        updateModals({ info: { isOpen: false } });
                     },
                  },
                  cancel: {
                     text: "Cancel",
                     callback: () => {
                        updateModals({ info: { isOpen: false } });
                     },
                  },
               },
            },
         });
      } else {
         mutation.mutate(channelId);
      }
   }
   return { tryMutate };
}
