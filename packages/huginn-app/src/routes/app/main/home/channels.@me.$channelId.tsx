import ChannelMessages from "@components/channels/ChannelMessages";
import DirectChannelCall from "@components/channels/DirectChannelCall";
import HomeTopBar from "@components/channels/HomeTopBar";
import RecipientsSidebar from "@components/channels/RecipientsSidebar";
import MessageBox from "@components/MessageBox";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useSafePathname } from "@hooks/useLastSafePathname";
import { ChannelType, snowflake } from "@huginn/shared";
import { getChannelsOptions, getMessagesOptions } from "@lib/queries";
import { clientStore, useClient } from "@stores/clientStore";
import { voiceClient } from "@stores/voiceStore";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";
import { type LoaderFunctionArgs, useParams } from "react-router";
import { queryClient } from "@/root";
import moment from "moment";

export async function channelWithIdLoader({ params }: LoaderFunctionArgs) {
   const client = clientStore.getState().client;
   if (!client) {
      return;
   }

   return queryClient.ensureInfiniteQueryData(getMessagesOptions(queryClient, client, params.channelId as string));
}

export default function ChannelWithId() {
   const { channelId } = useParams() as { channelId: string };
   const client = useClient();
   const queryClient = useQueryClient();
   const { error, data: messages } = useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client!, channelId));
   const channel = useSuspenseQuery(getChannelsOptions(client!, "@me")).data?.find((x: { id: string }) => x.id === channelId);
   const { navigateBack } = useSafePathname();
   const posthog = usePostHog();

   const handleServerError = useErrorHandler();

   const [recipientsVisible, setRecipientsVisible] = useState(true);

   const sortedMessages = useMemo(
      () =>
         messages.pages.flat().toSorted((a, b) => {
            if (a.isPreview !== b.isPreview) {
               return a.isPreview ? 1 : -1; // Move previews to the end
            }
            return moment(snowflake.getTimestamp(a.id)).isAfter(snowflake.getTimestamp(b.id)) ? 1 : -1;
         }),
      [messages],
   );

   useEffect(() => {
      if (!channel) {
         navigateBack();
         return;
      }
      if (error) {
         handleServerError(error);
      }
   }, [error]);

   function onRecipientsClick() {
      posthog.capture("channel:recipients_button_click");
      setRecipientsVisible((prev) => !prev);
   }

   async function onCallClick() {
      posthog.capture("channel:call_button_click");

      if (!channel) {
         return;
      }

      await Promise.allSettled([voiceClient.connect(null, channel.id), client?.channels.ring(channel.id, null)]);
   }

   return (
      channel && (
         <div className="flex h-full flex-col">
            <HomeTopBar channel={channel} onRecipientsClick={onRecipientsClick} onCallClick={onCallClick} />
            <div className="h-0.5 shrink-0 bg-white/10" />
            <div className="flex h-full w-full overflow-hidden">
               <div className="flex h-full w-full flex-col overflow-hidden">
                  <DirectChannelCall channelId={channelId} />
                  <ChannelMessages channelId={channelId} messages={sortedMessages} />
                  <MessageBox messages={sortedMessages} />
               </div>
               {channel.type === ChannelType.GROUP_DM && channel.ownerId && (
                  <RecipientsSidebar
                     channelId={channel.id}
                     recipientIds={channel.recipientIds}
                     ownerId={channel.ownerId}
                     visible={recipientsVisible}
                  />
               )}
            </div>
            <div className="bg-surface absolute bottom-0 flex h-16 w-full shrink-0" />
         </div>
      )
   );
}
