import { useClient } from "@stores/clientStore";
import { usePostHog } from "posthog-js/react";
import { useUpdateVoiceState } from "./useUpdateVoiceState";
import { useVoiceStore, voiceClient } from "@stores/voiceStore";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHuginnWindow } from "@stores/windowStore";
import { useModals } from "@stores/modalsStore";
import type { Snowflake } from "@huginn/shared";
import { useStartCamera } from "./useStartCamera";
import { useStorage } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";

export function useVoiceUtils() {
   const { localVoiceState, remoteSources } = useVoiceStore();
   const { user } = useThisUser();
   const settings = useStorage("settings");
   const client = useClient();
   const posthog = usePostHog();
   const updateVoiceStateMutation = useUpdateVoiceState();
   const startCameraMutation = useStartCamera();
   const { isFullscreen, toggleFullscreen } = useFullscreen();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();

   function connect(channelId: Snowflake) {
      voiceClient.connect(null, channelId);
   }

   function disconnect() {
      posthog.capture("voice:disconnect_button_click");
      client?.gateway.disconnectVoice();
   }

   function toggleMute() {
      posthog.capture("voice:toggle_mute_button_click");

      updateVoiceStateMutation.mutate({
         isAudioMuted: !localVoiceState.isAudioMuted,
         isAudioDeafened: false,
         isStreaming: localVoiceState.isStreaming,
         isCameraOn: localVoiceState.isCameraOn,
      });
   }

   function toggleDeafen() {
      posthog.capture("voice:toggle_deafen_button_click");

      updateVoiceStateMutation.mutate({
         isAudioMuted: !localVoiceState.isAudioDeafened,
         isAudioDeafened: !localVoiceState.isAudioDeafened,
         isStreaming: localVoiceState.isStreaming,
         isCameraOn: localVoiceState.isCameraOn,
      });
   }

   async function startScreenShare() {
      posthog.capture("voice:screen_share_button_click");

      if (isFullscreen) {
         toggleFullscreen();
      }

      if (huginnWindow.environment === "browser") {
         const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
         });
         await client?.voice.startStream(stream.getVideoTracks()[0], stream.getAudioTracks()[0]);
      } else {
         updateModals({ screenShare: { isOpen: true } });
      }
   }

   function startAudioStream() {
      posthog.capture("voice:stream_audio_button_click");

      if (isFullscreen) {
         toggleFullscreen();
      }

      if (huginnWindow.environment !== "desktop") {
         return;
      }

      updateModals({ streamAudio: { isOpen: true } });
   }

   function startCamera() {
      posthog.capture("voice:camera_button_click");

      if (!startCameraMutation.isPending) {
         startCameraMutation.mutate({ deviceId: settings.cameraDeviceId });
      }
   }

   function changeStream() {
      const audioRemoteSource = remoteSources.find((x) => x.userId === user?.id && x.kind === "stream_audio");
      const videoRemoteSource = remoteSources.find((x) => x.userId === user?.id && x.kind === "stream_video");

      // Pure audio stream
      if (audioRemoteSource && !videoRemoteSource) {
         startAudioStream();
      } else {
         startScreenShare();
      }
   }

   function endStream() {
      client?.voice.stopStream();
   }

   function endCamera() {
      client?.voice.stopCamera();
   }

   return {
      connect,
      disconnect,
      startCamera,
      startAudioStream,
      startScreenShare,
      changeStream,
      endStream,
      endCamera,
      toggleDeafen,
      toggleMute,
   };
}
