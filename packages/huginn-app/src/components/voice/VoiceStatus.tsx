import type { VoiceStatus } from "@huginn/shared";
import { useChannelName } from "@hooks/api-hooks/channelHooks";
import { useClient, useClientStore } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router";
import Tooltip from "../tooltip/Tooltip";
import { useUpdateVoiceState } from "@hooks/voice/useUpdateVoiceState";
import UserActionButton from "@components/button/UserActionButton";
import StreamButton from "@components/button/StreamButton";
import VoiceControlButton from "@components/button/VoiceControlButton";
import DropdownMenu from "@components/dropdown/DowndownMenu";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";

const statusTexts: Record<VoiceStatus, string> = {
   connected: "RTC Signalling...",
   authenticated: "RTC Signalling...",
   connecting: "RTC Signalling...",
   reconnecting: "Reconnecting...",
   disconnected: "Disconnected",
   none: "Connecting...",
   rtc_ready: "Connected",
};

export default function VoiceStatus() {
   const { voiceChannel } = useVoiceStore();
   const { voiceStatus } = useClientStore();
   const { startAudioStream, startScreenShare, changeStream, endStream, startCamera, endCamera } = useVoiceUtils();
   const client = useClient();
   const { user } = useThisUser();
   const channelName = useChannelName(voiceChannel.channelId ?? undefined);
   const [rtt, setRtt] = useState(0);
   const posthog = usePostHog();
   const { localVoiceState } = useVoiceStore();

   const latencyColor = useMemo(() => {
      const minPing = 100;
      const maxPing = 2000;

      if (rtt <= minPing) return "hsl(120, 100%, 73%)"; // green
      if (rtt >= maxPing) return "hsl(0, 100%, 73%)"; // red

      const t = (rtt - minPing) / (maxPing - minPing); // 0 to 1

      // Interpolate red and green channels
      const hue = 120 - 120 * t; // 120 (green) → 0 (red)
      return `hsl(${hue}, 100%, 73%)`;
   }, [rtt]);

   useEffect(() => {
      if (!client) {
         return;
      }

      const unlisten2 = client.voice.listen("pong", (d) => {
         setRtt(d.rtt);
      });

      return () => {
         unlisten2();
      };
   }, []);

   async function onDisconnect() {
      posthog.capture("voice:status_disconnect_button_click");
      await client?.gateway.disconnectVoice();
   }

   if (!user || !voiceChannel.channelId) {
      return;
   }

   return (
      <div className="w-full p-1">
         <div className="bg-surface flex h-full w-full flex-col items-center gap-y-2 rounded-lg p-2">
            <div className="flex w-full items-center">
               <div className="flex flex-col">
                  <div className="flex items-center gap-x-1">
                     <Tooltip>
                        {voiceStatus !== "rtc_ready" ? (
                           <IconMingcuteWifiOffLine
                              className={clsx(
                                 "size-6",
                                 (voiceStatus === "connecting" ||
                                    voiceStatus === "reconnecting" ||
                                    voiceStatus === "connected" ||
                                    voiceStatus === "none" ||
                                    voiceStatus === "authenticated" ||
                                    !voiceStatus) &&
                                    "text-caution-100",
                                 voiceStatus === "disconnected" && "text-negative-100",
                              )}
                           />
                        ) : (
                           <Tooltip.Trigger className="cursor-default">
                              <IconMingcuteWifiLine className="text-positive-100 size-6 transition-colors" style={{ color: latencyColor }} />
                           </Tooltip.Trigger>
                        )}
                        <Tooltip.Content extraStyle={{ color: latencyColor }}>{rtt} ms</Tooltip.Content>
                     </Tooltip>
                     <div
                        className={clsx(
                           "text-sm font-bold transition-colors",
                           (voiceStatus === "connecting" ||
                              voiceStatus === "reconnecting" ||
                              voiceStatus === "connected" ||
                              voiceStatus === "none" ||
                              voiceStatus === "authenticated" ||
                              !voiceStatus) &&
                              "!text-caution-100",
                           voiceStatus === "disconnected" && "!text-negative-100",
                        )}
                        style={{ color: latencyColor }}
                     >
                        {statusTexts[voiceStatus ?? "none"]}
                     </div>
                  </div>
                  <NavLink prefetch="intent" to={`/channels/@me/${voiceChannel.channelId}`} className="text-text/70 ml-7 text-xs hover:underline">
                     {channelName}
                  </NavLink>
               </div>
               <div className="ml-auto flex gap-x-1">
                  <UserActionButton tooltip="Disconnect" onClick={onDisconnect} hoverColor="negative">
                     <IconMingcutePhoneBlockFill className="size-5" />
                  </UserActionButton>
               </div>
            </div>
            <div className="flex w-full gap-x-2">
               <StreamButton
                  voiceState={localVoiceState}
                  anchor={{ gap: "8px" }}
                  onChangeStream={changeStream}
                  onEndStream={endStream}
                  onStartAudioStream={startAudioStream}
                  onStartScreenShare={startScreenShare}
                  hideArrow
                  className="w-full"
               >
                  <VoiceControlButton
                     color="surface-alt"
                     activeColor="primary"
                     activeHoverColor="primary"
                     hoverColor="surface-deep"
                     isActive={localVoiceState.isStreaming}
                     asChild
                     tooltip={localVoiceState.isStreaming ? "Stream Options" : "Start Stream"}
                     className={clsx("flex h-9 w-full items-center justify-center rounded-md !px-0")}
                  >
                     <DropdownMenu.Button>
                        <IconMingcuteMonitorFill className="size-5 shrink-0" />
                        <div className="text-sm text-white/50">/</div>
                        <IconMingcuteVolumeFill className="size-5 shrink-0" />
                     </DropdownMenu.Button>
                  </VoiceControlButton>
               </StreamButton>
               <VoiceControlButton
                  color="surface-alt"
                  activeColor="primary"
                  activeHoverColor="negative"
                  hoverColor="surface-deep"
                  isActive={localVoiceState.isCameraOn}
                  onClick={() => (localVoiceState.isCameraOn ? endCamera() : startCamera())}
                  tooltip={localVoiceState.isCameraOn ? "Turn off camera" : "Turn on camera"}
                  className={clsx("flex h-9 w-full items-center justify-center rounded-md !px-0")}
               >
                  <IconMingcuteCamera2Fill className="size-6" />
               </VoiceControlButton>
            </div>
         </div>
      </div>
   );
}
