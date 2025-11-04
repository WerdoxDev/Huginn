import { useClient } from "@stores/clientStore";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHuginnWindow } from "@stores/windowStore";
import { useModals } from "@stores/modalsStore";
import { useStorage } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { getMediaErrorMessage } from "@lib/utils";
import type { Snowflake } from "@huginn/shared";

export function useVoiceUtils() {
   const { user } = useThisUser();
   const settings = useStorage("settings");
   const client = useClient();
   // const posthog = usePostHog();
   // const updateVoiceStateMutation = useUpdateVoiceState();
   const { isFullscreen, toggleFullscreen } = useFullscreen();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();

   async function toggleMute() {
      const voiceState = client?.voiceManager.voiceState.gatewayVoiceState;
      await client?.voiceManager.voiceState.updateGatewayVoiceState({ isAudioMuted: !(voiceState?.isAudioMuted ?? false) });
   }

   async function toggleDeafen() {
      const voiceState = client?.voiceManager.voiceState.gatewayVoiceState;
      await client?.voiceManager.voiceState.updateGatewayVoiceState({
         isAudioDeafened: !(voiceState?.isAudioDeafened ?? false),
         isAudioMuted: !(voiceState?.isAudioDeafened ?? false),
      });
   }

   async function openScreenShare() {
      async function open(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack) {
         // We have a audio track to use
         if (audioTrack) {
            // Stream already has audio, so replace it
            if (client?.voice.transport.getProducer("stream_audio")) {
               await client.voice.stream.replaceStreamAudioTrack(audioTrack);
            }
            // Stream didn't have audio, so add it
            else {
               await client?.voice.stream.openStream(undefined, audioTrack);
            }
         }
         // We don't have an audio track but stream had audio, so close it
         else if (client?.voice.transport.getProducer("stream_audio")) {
            await client.voice.stream.closeStreamAudio();
         }

         // We have a new video track, so replace it
         if (client?.voice.transport.getProducer("stream_video")) {
            await client.voice.stream.replaceStreamVideoTrack(videoTrack);
         }
         // We never started screen sharing, so start it.
         else {
            await client?.voice.stream.openStream(videoTrack, audioTrack);
         }
      }

      try {
         if (isFullscreen) {
            toggleFullscreen();
         }

         if (huginnWindow.environment === "browser") {
            const stream = await navigator.mediaDevices.getDisplayMedia({
               audio: true,
               video: true,
            });
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            await open(videoTrack, audioTrack);
         } else {
            updateModals({
               screenShare: {
                  isOpen: true,
                  callback: async (stream: MediaStream, shareAudio: boolean, sourceName: string) => {
                     // Reset loopback even if we want to start a new one / end the last one
                     await client?.voice.stopAudioLoopback();

                     let audioTrack: MediaStreamTrack | undefined = stream.getAudioTracks()[0];
                     if (!audioTrack && shareAudio) {
                        audioTrack = await client?.voice.startAudioLoopback(sourceName);
                     }

                     const videoTrack = stream.getVideoTracks()[0];
                     await open(videoTrack, audioTrack);
                  },
               },
            });
         }
      } catch (e) {
         console.error(e);
         updateModals({
            info: { status: "error", title: "Screen Sharing Failed", text: getMediaErrorMessage(e, "screen"), isOpen: true },
         });
      }
   }

   function openAudioStream() {
      if (isFullscreen) {
         toggleFullscreen();
      }

      if (huginnWindow.environment !== "desktop") {
         return;
      }

      updateModals({
         streamAudio: {
            isOpen: true,
            callback: async (sourceProcessId: string) => {
               // Reset loopback even if we want to start a new one / end the last one
               await client?.voice.stopAudioLoopback();
               const audioTrack = await client?.voice.startAudioLoopback(undefined, sourceProcessId);

               if (!audioTrack) throw new Error("Audio track was null when opening audio stream");

               if (client?.voice.transport.getProducer("stream_audio")) {
                  await client?.voice.stream.replaceStreamAudioTrack(audioTrack);
               } else {
                  await client?.voice.stream.openStream(undefined, audioTrack);
               }
            },
         },
      });
   }

   async function openCamera() {
      try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: settings.cameraDeviceId, frameRate: 30 },
         });
         const track = stream.getVideoTracks()[0];

         if (client?.voice.transport.getProducer("camera")) {
            await client.voice.device.replaceCameraTrack(track);
         } else {
            await client?.voice.device.openCamera(track);
         }
      } catch (e) {
         console.error(e);
         updateModals({
            info: { status: "error", title: "Opening Camera Failed", text: getMediaErrorMessage(e, "camera"), isOpen: true },
         });
      }
   }

   async function consumeStream(userId: Snowflake) {
      try {
         const remoteProducers = client?.voice.transport.getRemoteProducers();

         if (remoteProducers?.some((x) => x.kind === "stream_video" && x.userId === userId)) {
            await client?.voice.transport.createConsumer(userId, "stream_video");
         }
         if (remoteProducers?.some((x) => x.kind === "stream_audio" && x.userId === userId)) {
            await client?.voice.transport.createConsumer(userId, "stream_audio");
         }
      } catch (e) {
         console.error(e);
         updateModals({
            info: {
               status: "error",
               title: "Watching/Listening Stream Failed",
               text: "An unexpected error occurred. Please try again.",
               isOpen: true,
            },
         });
      }
   }

   function changeStream() {
      const audioProducer = client?.voice.transport.getProducer("stream_audio");
      const videoProducer = client?.voice.transport.getProducer("stream_video");

      // Audio Stream
      if (audioProducer && !videoProducer) {
         openAudioStream();
      }
      // Screen Share
      else {
         openScreenShare();
      }
   }

   async function closeStream() {
      try {
         await client?.voice.stream.closeStream();
      } catch (e) {
         console.error(e);
         updateModals({
            info: {
               status: "error",
               title: "Closing Screen Sharing Failed",
               text: getMediaErrorMessage(e, "screen"),
               isOpen: true,
            },
         });
      }
   }

   async function closeCamera() {
      try {
         await client?.voice.device.closeCamera();
      } catch (e) {
         console.error(e);
         updateModals({
            info: { status: "error", title: "Closing Camera Failed", text: getMediaErrorMessage(e, "camera"), isOpen: true },
         });
      }
   }

   return {
      openCamera,
      openAudioStream,
      openScreenShare,
      changeStream,
      consumeStream,
      closeStream,
      closeCamera,
      toggleDeafen,
      toggleMute,
   };
}
