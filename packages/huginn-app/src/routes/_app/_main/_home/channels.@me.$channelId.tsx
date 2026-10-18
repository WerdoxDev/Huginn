import ChannelBackground from "@components/channels/ChannelBackground";
import ChannelMessages from "@components/channels/ChannelMessages";
import ChannelSidebar from "@components/channels/ChannelSidebar";
import ChannelWithIdTopBar from "@components/channels/ChannelWithIdTopBar";
import DirectChannelCall from "@components/channels/DirectChannelCall";
import ErrorComponent from "@components/ErrorComponent";
import MessageBox from "@components/MessageBox";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginnjs/shared";
import { PushNotifications } from "@lib/capacitor/push-notification-plugin";
import { getMessagesOptions, queryClient } from "@lib/queries";
import { getVoiceConnectionErrorMessage } from "@lib/voice/voice-errors";
import { clientStore, useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useSidebarStore, type ChannelSidebarPanel } from "@stores/sidebarStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, type MouseEvent } from "react";

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
   const channel = useCurrentChannel();
   const posthog = usePostHog();
   const isMobile = useIsMobile();
   const settings = useStorage("settings");
   const { setValue } = useStorageStore();
   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();

   const { resetToCenter, toggleRight, closeRight, isRightOpen, rightPanel } = useSidebarStore();
   const isSidebarVisible = isRightOpen && (rightPanel === "search" || channel?.type === ChannelType.GROUP_DM);

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
      if (huginnWindow.environment !== "android") return;

      void PushNotifications.setActiveChannel({ channelId: channelId ?? null });

      return () => {
         void PushNotifications.setActiveChannel({ channelId: null });
      };
   }, [channelId, huginnWindow.environment]);

   function onSidebarPanelClick(e: MouseEvent, panel: ChannelSidebarPanel) {
      e.stopPropagation();
      const nextOpen = !isRightOpen || rightPanel !== panel;
      toggleRight(panel);

      if (!isMobile && settings) {
         setValue("settings", { ...settings, isChannelSidebarOpen: nextOpen });
      }

      if (panel === "members") posthog.capture("channel:recipients_button_click");
   }

   function onSidebarClose() {
      closeRight();
      if (!isMobile && settings) {
         setValue("settings", { ...settings, isChannelSidebarOpen: false });
      }
   }

   async function onCallClick(e: MouseEvent) {
      e.stopPropagation();
      if (!channel) return;

      try {
         await client?.voiceManager.connectVoice(null, channel.id);
         await client?.channels.ring(channel.id, null);
      } catch (error) {
         updateModals({
            info: {
               isOpen: true,
               status: "error",
               title: "Connecting To Voice Failed",
               text: getVoiceConnectionErrorMessage(error),
            },
         });
         return;
      }

      posthog.capture("channel:call_button_click");
   }

   return (
      <div className="flex h-full flex-col">
         {channel ? (
            <>
               <ChannelWithIdTopBar
                  channel={channel}
                  onRecipientsClick={(event) => onSidebarPanelClick(event, "members")}
                  onSearchClick={(event) => onSidebarPanelClick(event, "search")}
                  onCallClick={onCallClick}
               />
               <div className="flex h-full w-full overflow-hidden">
                  <div className="relative flex h-full w-full flex-col overflow-hidden">
                     <div
                        className={clsx(
                           "absolute inset-0 z-40 bg-black/50 transition-all lg:pointer-events-none lg:z-auto lg:opacity-0",
                           isSidebarVisible ? "opacity-100" : "pointer-events-none opacity-0",
                        )}
                        onClick={resetToCenter}
                     />
                     <ChannelBackground channelId={channelId} />
                     <DirectChannelCall channelId={channelId} />
                     <ChannelMessages messages={sortedMessages} channel={channel} />
                     <MessageBox messages={sortedMessages} />
                  </div>

                  <ChannelSidebar channel={channel} onClose={onSidebarClose} />
               </div>
               {/* <div className="bg-surface absolute bottom-0 flex h-16 w-full shrink-0" /> */}
            </>
         ) : (
            <ErrorComponent error="Channel not found" />
         )}
      </div>
   );
}
