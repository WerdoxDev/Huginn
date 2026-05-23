import ChannelMessages from "@components/channels/ChannelMessages";
import ChannelSidebar from "@components/channels/ChannelSidebar";
import ChannelWithIdTopBar from "@components/channels/ChannelWithIdTopBar";
import DirectChannelCall from "@components/channels/DirectChannelCall";
import ErrorComponent from "@components/ErrorComponent";
import MessageBox from "@components/MessageBox";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginn/shared";
import { getChannelsOptions, getMessagesOptions, queryClient } from "@lib/queries";
import { clientStore, useClient } from "@stores/clientStore";
import { useMobileMenuStore } from "@stores/mobileMenuStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

export const Route = createFileRoute("/_app/_main/_home/channels/@me/$channelId")({
   component: ChannelWithIdComponent,
   loader: async ({ params }) => {
      const client = clientStore.getState().client;
      if (!client) return;

      // await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading time
      return await queryClient.ensureInfiniteQueryData(getMessagesOptions(queryClient, client, params.channelId as string));
   },
});

function ChannelWithIdComponent() {
   const { channelId } = useParams({ strict: false }) as { channelId: string };
   const client = useClient();
   const queryClient = useQueryClient();
   const { data: messages } = useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client!, channelId));
   const { data } = useSuspenseQuery(getChannelsOptions(client!, "@me"));
   const channel = useMemo(() => data.find((x) => x.id === channelId), [channelId, data]);
   const posthog = usePostHog();
   const isMobile = useIsMobile();
   const router = useRouter();
   const settings = useStorage("settings");
   const { setValue } = useStorageStore();

   const [recipientsVisible, setRecipientsVisible] = useState(true);
   const { resetToCenter } = useMobileMenuStore();
   const { toggleRight, closeLeft, isRightOpen, openRight, closeRight } = useMobileMenuStore();

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
      if (isMobile) {
         resetToCenter();
      }
   }, [channelId, isMobile, resetToCenter]);

   useEffect(() => {
      if (isMobile || !settings) return;

      if (settings.isChannelSidebarOpen) {
         openRight();
      } else {
         closeRight();
      }
   }, [isMobile, settings?.isChannelSidebarOpen, openRight, closeRight]);

   function onRecipientsClick(e: MouseEvent) {
      e.stopPropagation();
      closeLeft();
      toggleRight();

      if (!isMobile && settings) {
         const nextOpen = !isRightOpen;
         setValue("settings", { ...settings, isChannelSidebarOpen: nextOpen });
      }

      setRecipientsVisible((prev) => !prev);
      posthog.capture("channel:recipients_button_click");
   }

   async function onCallClick(e: MouseEvent) {
      e.stopPropagation();
      if (!channel) return;

      await client?.voiceManager.connectVoice(null, channel.id);
      await client?.channels.ring(channel.id, null);

      posthog.capture("channel:call_button_click");
   }

   return (
      <div className="flex h-full flex-col">
         {channel ? (
            <>
               <ChannelWithIdTopBar
                  channel={channel}
                  onRecipientsClick={onRecipientsClick}
                  onCallClick={onCallClick}
                  onClick={isMobile && channel.type === ChannelType.GROUP_DM ? onRecipientsClick : undefined}
               />
               <div className="flex h-full w-full overflow-hidden">
                  <div className="relative flex h-full w-full flex-col overflow-hidden">
                     <div
                        className={clsx(
                           "absolute inset-0 z-20 bg-black/50 transition-all lg:pointer-events-none lg:z-auto lg:opacity-0",
                           isRightOpen ? "opacity-100" : "pointer-events-none opacity-0",
                        )}
                        onClick={resetToCenter}
                     />
                     <DirectChannelCall channelId={channelId} />
                     <ChannelMessages channelId={channelId} messages={sortedMessages} />
                     <MessageBox messages={sortedMessages} />
                  </div>

                  <ChannelSidebar channel={channel} />
               </div>
               <div className="bg-surface absolute bottom-0 flex h-16 w-full shrink-0" />
            </>
         ) : (
            <ErrorComponent error="Channel not found" />
         )}
      </div>
   );
}
