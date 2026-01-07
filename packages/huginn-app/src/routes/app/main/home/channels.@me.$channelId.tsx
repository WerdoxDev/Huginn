import ChannelMessages from "@components/channels/ChannelMessages";
import DirectChannelCall from "@components/channels/DirectChannelCall";
import ChannelTopBar from "@components/channels/ChannelTopBar";
import RecipientsSidebar from "@components/channels/RecipientsSidebar";
import MessageBox from "@components/MessageBox";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useSafePathname } from "@hooks/useLastSafePathname";
import { ChannelType } from "@huginn/shared";
import { getChannelsOptions, getMessagesOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router";
import { useMobileMenuStore } from "@stores/mobileMenuStore";

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
   const { resetToCenter } = useMobileMenuStore();
   const { toggleRight } = useMobileMenuStore();

   const sortedMessages = useMemo(
      () =>
         messages.pages.flat().toSorted((a, b) => {
            if (a.isPreview !== b.isPreview) {
               return a.isPreview ? 1 : -1; // Move previews to the end
            }

            // Server does send message already sorted but when we edit a message in the app, it gets pushed to the end of the list. So we need to sort here as well
            const x = BigInt(a.id);
            const y = BigInt(b.id);
            return x < y ? -1 : x > y ? 1 : 0;
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

   useEffect(() => {
      resetToCenter();
   }, [channel]);

   function onRecipientsClick() {
      toggleRight();
      setRecipientsVisible((prev) => !prev);
      posthog.capture("channel:recipients_button_click");
   }

   async function onCallClick() {
      if (!channel) {
         return;
      }

      await client?.voiceManager.connectVoice(null, channel.id);
      await client?.channels.ring(channel.id, null);

      posthog.capture("channel:call_button_click");
   }

   return (
      channel && (
         <div className="flex h-full flex-col">
            <ChannelTopBar channel={channel} onRecipientsClick={onRecipientsClick} onCallClick={onCallClick} />

            <div className="flex h-full w-full overflow-hidden">
               <div className="flex h-full w-full flex-col overflow-hidden">
                  <DirectChannelCall channelId={channelId} />
                  <ChannelMessages channelId={channelId} messages={sortedMessages} />
                  <MessageBox messages={sortedMessages} />
               </div>
            </div>
            <div className="bg-surface absolute bottom-0 flex h-16 w-full shrink-0" />
         </div>
      )
   );
}
