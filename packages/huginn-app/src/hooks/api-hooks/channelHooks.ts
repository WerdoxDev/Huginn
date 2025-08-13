import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { type APIGetUserChannelsResult, type APIPublicUser, ChannelType, type DirectChannel, type Snowflake } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useUsers } from "./userHooks";
import { findChannel, getChannelName } from "@lib/query-utils";
import { getChannelsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";

export function useChannel(channelId?: Snowflake, guildId = "@me") {
   const client = useClient();
   const { data } = useQuery(getChannelsOptions(client!, guildId));

   return useMemo(() => findChannel(data, channelId), [data, channelId]);
}

export function useChannelName(channelId?: Snowflake): string {
   const channel = useChannel(channelId);
   const recipients = useUsers(channel?.recipientIds);

   return useMemo(() => getChannelName(channel?.name, recipients), [channelId, recipients, channel]);
}

export function useChannelNamePlaceholder(recipients: APIPublicUser[]) {
   return useMemo(() => recipients.map((x) => x.displayName ?? x.username).join(", "), [recipients]);
}

export function useChannelRecipients(channelId?: Snowflake, _guildId?: Snowflake) {
   const channel = useChannel(channelId);
   const recipients = useUsers(channel?.recipientIds);

   return { recipients, ownerId: channel?.ownerId };
}

export function useCurrentChannel() {
   const { channelId } = useParams<{ channelId: string }>();
   const queryClient = useQueryClient();

   // TODO: CHANGE THIS WHEN GUILDS ARE A THING
   const channels = queryClient.getQueryData<APIGetUserChannelsResult>(["channels", "@me"]);

   return useMemo(() => channels?.find((channel) => channel.id === channelId), [channelId, channels]);
}

export default function useNavigateToChannel() {
   const navigate = useNavigate();

   async function navigateToChannel(guildId: Snowflake, channelId: Snowflake) {
      await navigate(`/channels/${guildId}/${channelId}`);
   }

   return navigateToChannel;
}

export function useSafeDeleteDMChannel(channelId?: Snowflake, channelType?: DirectChannel["type"], channelName?: string) {
   const mutation = useDeleteDMChannel();
   const { updateModals } = useModals();

   function tryMutate() {
      if (!channelId) {
         return;
      }

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
                     mutationKey: "delete-dm-channel",
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
