import { queryClient as client } from "@/root";
import type { AppDirectChannel } from "@/types";
import type { APIGetUserChannelsResult, APIPublicUser, PresenceUser, Snowflake } from "@huginn/shared";

export function updateUser(user: PresenceUser, queryClient = client) {
   queryClient.setQueryData<PresenceUser>(["user", user.id], (old) => (old ? { ...old, ...user } : user));
}

export function getUser(userId: Snowflake, queryClient = client) {
   return queryClient.getQueryData<APIPublicUser>(["user", userId]);
}

export function getChannelName(channelName: string | null | undefined, recipients: (APIPublicUser | undefined)[]) {
   return channelName ? channelName : recipients?.map((x) => x?.displayName ?? x?.username).join(", ");
}

export function getChannels(guildId = "@me", queryClient = client) {
   const channels = queryClient.getQueryData<AppDirectChannel[]>(["channels", guildId]);
   return channels;
}

export function findChannel(channels: AppDirectChannel[] | undefined, channelId: Snowflake | undefined) {
   return channels?.find((x) => x.id === channelId);
}

export function getChannelRecipients(channelId: Snowflake, queryClient = client) {
   const channel = findChannel(getChannels("@me", queryClient), channelId);
   const recipients = channel?.recipientIds.map((x) => getUser(x, queryClient));

   return recipients ?? [];
}

export function updateChannelLastMessageId(channelId: Snowflake, messageId: Snowflake, queryClient = client) {
   queryClient.setQueryData<APIGetUserChannelsResult>(["channels", "@me"], (data) => {
      if (!data) return undefined;

      const channel = data.find((x) => x.id === channelId);
      if (!channel) return data;

      return [{ ...channel, lastMessageId: messageId }, ...data.filter((x) => x.id !== channelId)];
   });
}