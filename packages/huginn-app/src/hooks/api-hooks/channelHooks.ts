import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { ChannelType, type DirectChannel, type Snowflake } from "@huginnjs/shared";
import { getChannelsOptions } from "@lib/queries";
import { findChannel } from "@lib/query-utils";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";

import type { AppUser } from "@/types";

import { useUsers } from "./userHooks";

export function useChannel(channelId?: Snowflake, guildId = "@me") {
   const { data } = useQuery(getChannelsOptions(guildId));

   return useMemo(() => findChannel(data, channelId), [data, channelId]);
}

export function useChannelNamePlaceholder(recipients: AppUser[]) {
   return useMemo(() => recipients.map((x) => x.displayName).join(", "), [recipients]);
}

export function useChannelRecipients(channelId?: Snowflake, _guildId?: Snowflake, withThisUser?: boolean) {
   const { user } = useThisUser();
   const channel = useChannel(channelId);
   const recipients = useUsers(withThisUser && user && channel?.recipientIds ? [...channel.recipientIds, user?.id] : channel?.recipientIds);

   return { recipients, ownerId: channel?.type === ChannelType.GROUP_DM ? channel?.ownerId : undefined };
}

export function useCurrentChannel() {
   const { channelId } = useParams({ strict: false });

   const channel = useChannel(channelId);
   return channel;
}

export function useSafeDeleteDMChannel(channelId?: Snowflake, channelType?: DirectChannel["type"], channelName?: string) {
   const mutation = useDeleteDMChannel();
   const currentChannel = useCurrentChannel();
   const navigate = useNavigate();
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
                        if (currentChannel?.id === channelId) {
                           await navigate({ to: "/channels/@me", replace: true });
                        }

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
