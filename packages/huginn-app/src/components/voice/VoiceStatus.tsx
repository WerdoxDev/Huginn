import type { VoiceStatus } from "@huginnjs/api";

import StreamButton from "@components/button/StreamButton";
import UserActionButton from "@components/button/UserActionButton";
import VoiceControlButton from "@components/button/VoiceControlButton";
import { HuginnMenu } from "@components/dropdown/HuginnMenu";
import { useChannel } from "@hooks/api-hooks/channelHooks";
import { useVoiceSnapshot } from "@hooks/voice/useMediaSources";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { VoiceClient } from "@lib/voice/voice-client";
import { useClient, useClientStore } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";

import Tooltip from "../tooltip/Tooltip";

const RTT_UPDATE_INTERVAL = 2000;

const statuses: Record<VoiceStatus, { text: string; color?: string }> = {
   disconnected: { text: "Disconnected", color: "!text-negative-300" },
   idle: { text: "Connecting...", color: "!text-caution-300" },
   connecting: { text: "Connecting...", color: "!text-caution-300" },
   ready: { text: "Connected" },
   signaling: { text: "RTC Signalling...", color: "!text-caution-300" },
};

export default function VoiceStatus() {
   const { voiceState } = useVoiceStore();
   const { voiceStatus } = useClientStore();
   const { changeStream, updateStream, openCamera, closeStream, openAudioStream, openScreenShare, closeCamera } = useVoiceUtils();
   const client = useClient();
   const { user } = useThisUser();
   const channel = useChannel(voiceState.channelId ?? undefined);
   const [rtt, setRtt] = useState(0);
   const posthog = usePostHog();

   const { mediaSources } = useVoiceSnapshot();
   const videoSource = mediaSources.find((x) => x.kind === "stream_video" && x.type === "producing");
   const audioSource = mediaSources.find((x) => x.kind === "stream_audio" && x.type === "producing");

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
      if (!client || voiceStatus !== "ready") {
         setRtt(0);
         return;
      }

      let cancelled = false;
      const updateRtt = async () => {
         const roundTripTime = await client.voice.getCurrentRoundTripTime();
         if (!cancelled && roundTripTime !== undefined) setRtt(Math.round(roundTripTime));
      };

      void updateRtt();
      const interval = window.setInterval(() => void updateRtt(), RTT_UPDATE_INTERVAL);

      return () => {
         cancelled = true;
         window.clearInterval(interval);
      };
   }, [client, voiceStatus]);

   async function onDisconnect() {
      posthog.capture("voice:status_disconnect_button_click");
      await VoiceClient.sendMessage("disconnect_voice");
   }

   async function onDebug() {
      await client?.voice.debugger.openDebugger();
   }

   if (!user || !voiceState.channelId) {
      return;
   }

   return (
      <div className="w-full p-1">
         <div className="bg-surface flex h-full w-full flex-col items-center gap-y-2 rounded-lg p-2">
            <div className="flex w-full items-center">
               <div className="flex flex-col">
                  <div className="flex items-center gap-x-1">
                     <Tooltip>
                        {voiceStatus !== "ready" ? (
                           <IconMingcuteWifiOffLine className={clsx("size-6", statuses[voiceStatus ?? "idle"].color)} />
                        ) : (
                           <Tooltip.Trigger className="cursor-default">
                              <IconMingcuteWifiLine className="text-positive-100 size-6 transition-colors" style={{ color: latencyColor }} />
                           </Tooltip.Trigger>
                        )}
                        <Tooltip.Content extraStyle={{ color: latencyColor }}>{rtt} ms</Tooltip.Content>
                     </Tooltip>
                     <div
                        className={clsx("text-sm font-bold transition-colors", voiceStatus && statuses[voiceStatus].color)}
                        style={{ color: latencyColor }}
                     >
                        {statuses[voiceStatus ?? "idle"].text}
                     </div>
                  </div>
                  <Link
                     preload="intent"
                     to="/channels/@me/$channelId"
                     params={{ channelId: voiceState.channelId }}
                     className="text-text/70 ml-7 text-xs hover:underline"
                  >
                     {channel?.name}
                  </Link>
               </div>
               <div className="ml-auto flex gap-x-1">
                  <UserActionButton tooltip="Debug" onClick={onDebug} hoverColor="surface-alt" innerClassName="group-hover:rotate-0">
                     <IconMingcuteBugFill className="size-5" />
                  </UserActionButton>
                  <UserActionButton tooltip="Disconnect" onClick={onDisconnect} hoverColor="negative">
                     <IconMingcutePhoneBlockFill className="size-5" />
                  </UserActionButton>
               </div>
            </div>
            <div className="flex w-full gap-x-2">
               <StreamButton
                  voiceState={voiceState}
                  mediaSource={videoSource ?? audioSource}
                  onUpdateStream={updateStream}
                  // onUpdateStream={}
                  // menu={{ side: "top", align: "center", sideOffset: 4 }}
                  onChangeStream={changeStream}
                  onCloseStream={closeStream}
                  onOpenAudioStream={openAudioStream}
                  onOpenScreenShare={openScreenShare}
                  hideArrow
                  className="w-full"
               >
                  <VoiceControlButton
                     color="surface-alt"
                     activeColor="primary"
                     activeHoverColor="primary"
                     hoverColor="surface-deep"
                     isActive={voiceState.isAudioStreaming || voiceState.isScreenSharing}
                     tooltip={voiceState.isAudioStreaming || voiceState.isScreenSharing ? "Stream Options" : "Start Stream"}
                     asChild
                     className={clsx("flex h-9 w-full items-center justify-center rounded-md px-0!")}
                  >
                     <HuginnMenu.Trigger className="flex items-center gap-x-1">
                        <IconMingcuteMonitorFill className="size-5 shrink-0" />
                        <div className="text-sm text-white/50">/</div>
                        <IconMingcuteVolumeFill className="size-5 shrink-0" />
                     </HuginnMenu.Trigger>
                  </VoiceControlButton>
               </StreamButton>
               <VoiceControlButton
                  color="surface-alt"
                  activeColor="primary"
                  activeHoverColor="negative"
                  hoverColor="surface-deep"
                  isActive={voiceState.isCameraOn}
                  onClick={() => (voiceState.isCameraOn ? closeCamera() : openCamera())}
                  tooltip={voiceState.isCameraOn ? "Turn off camera" : "Turn on camera"}
                  className={clsx("flex h-9 w-full items-center justify-center rounded-md px-0!")}
               >
                  <IconMingcuteCamera2Fill className="size-6" />
               </VoiceControlButton>
            </div>
         </div>
      </div>
   );
}
