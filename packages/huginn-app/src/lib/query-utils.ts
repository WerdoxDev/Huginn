import { queryClient as client } from "@/root";
import type { AppDirectChannel, AppMessage, AppUser } from "@/types";
import type { APIGetUserChannelsResult, PresenceUser, Snowflake } from "@huginn/shared";
import { convertToAppUser } from "./utils";
import type { InfiniteData } from "@tanstack/react-query";

export function updateUser(user: PresenceUser, queryClient = client) {
   queryClient.setQueryData<AppUser>(["user", user.id], (old) => (old ? convertToAppUser({ ...old, ...user }) : convertToAppUser(user)));
}

export function getUser(userId: Snowflake, queryClient = client) {
   return queryClient.getQueryData<AppUser>(["user", userId]);
}

export function getUsers(userIds: Snowflake[], queryClient = client) {
   return queryClient
      .getQueriesData<AppUser>({ queryKey: ["user"] })
      .map(([_, data]) => data)
      .filter((user): user is AppUser => !!user && userIds.includes(user.id));
}

export function getChannels(guildId = "@me", queryClient = client) {
   const channels = queryClient.getQueryData<AppDirectChannel[]>(["channels", guildId]);
   return channels;
}

export function getChannelComputedName(channel: AppDirectChannel, recipientIds: Snowflake[], queryClient = client) {
   const recipients = getUsers(recipientIds, queryClient);

   return channel.originalName === undefined
      ? undefined
      : channel.originalName === null
        ? recipients.map((x) => x.displayName).join(", ")
        : channel.originalName;
}

export function findChannel(channels: AppDirectChannel[] | undefined, channelId: Snowflake | undefined) {
   return channels?.find((x) => x.id === channelId);
}

export function getChannelRecipients(channelId: Snowflake, queryClient = client) {
   const channel = findChannel(getChannels("@me", queryClient), channelId);
   const recipients = getUsers(channel?.recipientIds ?? [], queryClient);

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

export function getCurrentPageMessages(channelId: Snowflake, queryClient = client) {
   const messages = queryClient.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId]);
   return messages?.pages.flat();
}

export function getMessage(channelId: Snowflake, messageId?: Snowflake, queryClient = client) {
   const messages = queryClient.getQueryData<InfiniteData<AppMessage>>(["messages", channelId]);
   return messages?.pages.flatMap((x) => x).find((x) => x.id === messageId);
}
