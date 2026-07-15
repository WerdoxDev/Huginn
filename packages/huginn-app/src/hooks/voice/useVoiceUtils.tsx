import type { VoiceStreamOptions } from "@huginn/api";

import { useFullscreen } from "@hooks/useFullscreen";
import { type Snowflake } from "@huginn/shared";
import { getMediaErrorMessage } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";

export function useVoiceUtils() {
   const settings = useStorage("settings");
   const { setValue } = useStorageStore();
   const client = useClient();
   // const posthog = usePostHog();
   // const updateVoiceStateMutation = useUpdateVoiceState();
   const { isFullscreen, toggleFullscreen } = useFullscreen();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();

   async function toggleMute() {
      const voiceState = client?.voiceManager.voiceState.gatewayVoiceState;
      const newMutedState = !(voiceState?.isAudioMuted ?? false);
      const newDeafenedState = newMutedState ? (voiceState?.isAudioDeafened ?? false) : false;
      await client?.voiceManager.voiceState.updateGatewayVoiceState({
         isAudioMuted: newMutedState,
         isAudioDeafened: newDeafenedState,
      });
      await setValue("settings", { ...settings, isVoiceMuted: newMutedState, isVoiceDeafened: newDeafenedState });
   }

   async function toggleDeafen() {
      const voiceState = client?.voiceManager.voiceState.gatewayVoiceState;
      const newDeafenedState = !(voiceState?.isAudioDeafened ?? false);
      await client?.voiceManager.voiceState.updateGatewayVoiceState({
         isAudioDeafened: newDeafenedState,
         isAudioMuted: newDeafenedState ? true : settings.isVoiceMuted,
      });
      await setValue("settings", { ...settings, isVoiceDeafened: newDeafenedState });
   }

   async function openScreenShare() {
      const videoProducer = client?.voice.transport.getProducer("stream_video");
      const audioProducer = client?.voice.transport.getProducer("stream_audio");

      async function open(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack, options?: VoiceStreamOptions) {
         // Video is already open, replace it
         if (videoProducer) {
            await client?.voice.stream.replaceStreamVideoTrack(videoTrack);
            if (options?.maxVideoBitrate) {
               await client?.voice.stream.updateVideoBitrate(options?.maxVideoBitrate);
            }
         }
         // If video is not there, audio is also not there. So start a stream
         else {
            await client?.voice.stream.openStream(videoTrack, audioTrack, options);
            return;
         }

         // Audio is already open and audio track is given, replace it
         if (audioProducer && audioTrack) {
            await client?.voice.stream.replaceStreamAudioTrack(audioTrack);
            if (options?.maxAudioBitrate) {
               await client?.voice.stream.updateAudioBitrate(options.maxAudioBitrate);
            }
         }
         // Audio track is not given but it exists, so remove it.
         else if (audioProducer && !audioTrack) await client?.voice.stream.closeStreamAudio();
         // Audio is not open but track is given, so open audio
         else await client?.voice.stream.openStream(undefined, audioTrack, options);
      }

      try {
         if (isFullscreen) toggleFullscreen();

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
                  type: videoProducer ? "change" : "create",
                  callback: async (options) => {
                     try {
                        // Reset loopback even if we want to start a new one / end the last one
                        await client?.voice.stopAudioLoopback();

                        let audioTrack: MediaStreamTrack | undefined = options.stream.getAudioTracks()[0];
                        if (!audioTrack && options.isAudioEnabled && options.type === "display") {
                           audioTrack = await client?.voice.startAudioLoopback(options.sourceName);
                        }

                        const videoTrack = options.stream.getVideoTracks()[0];
                        await open(videoTrack, audioTrack, {
                           useSimulcast: options.isSimulcastEnabled,
                           maxAudioBitrate: options.maxAudioBitrate,
                           maxVideoBitrate: options.maxVideoBitrate,
                        });
                     } catch (e) {
                        updateModals({
                           info: {
                              status: "error",
                              title: "Screen Sharing Failed",
                              text: getMediaErrorMessage(e, "screen"),
                              isOpen: true,
                           },
                        });

                        await closeStream();
                     }
                  },
               },
            });
         }
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Screen Sharing Failed",
               text: getMediaErrorMessage(e, "screen"),
               isOpen: true,
            },
         });

         if (client?.voice.transport.getProducer("stream_video") || client?.voice.transport.getProducer("stream_audio")) await closeStream();
      }
   }

   function openAudioStream() {
      if (isFullscreen) {
         toggleFullscreen();
      }

      if (huginnWindow.environment !== "desktop") return;

      updateModals({
         streamAudio: {
            isOpen: true,
            callback: async (sourceProcessId: string) => {
               try {
                  // Reset loopback even if we want to start a new one / end the last one
                  await client?.voice.stopAudioLoopback();
                  const audioTrack = await client?.voice.startAudioLoopback(undefined, sourceProcessId);

                  if (!audioTrack) throw new Error("Audio track was null when opening audio stream");

                  if (client?.voice.transport.getProducer("stream_audio")) {
                     await client?.voice.stream.replaceStreamAudioTrack(audioTrack);
                  } else {
                     await client?.voice.stream.openStream(undefined, audioTrack);
                  }
               } catch (e) {
                  updateModals({
                     info: {
                        status: "error",
                        title: "Audio Stream Failed",
                        text: "An unexpected error occurred. Please try again.",
                        isOpen: true,
                     },
                  });

                  if (client?.voice.transport.getProducer("stream_audio")) await closeStream();
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
         updateModals({
            info: {
               status: "error",
               title: "Opening Camera Failed",
               text: getMediaErrorMessage(e, "camera"),
               isOpen: true,
            },
         });

         if (client?.voice.transport.getProducer("camera")) await closeCamera();
      }
   }

   async function consumeStream(userId: Snowflake, guildId: Snowflake | null, channelId: Snowflake) {
      if (!client) return;
      try {
         if (client.voice.status === "disconnected") throw new Error("Voice is disconnected");

         if (client.voice.status !== "ready") {
            await client.voiceManager.connectVoice(guildId, channelId);
         }

         const remoteProducers = client.voice.transport.getRemoteProducers();

         if (remoteProducers?.some((x) => x.kind === "stream_video" && x.userId === userId)) {
            await client.voice.transport.createConsumer(userId, "stream_video");
         }
         if (remoteProducers?.some((x) => x.kind === "stream_audio" && x.userId === userId)) {
            await client.voice.transport.createConsumer(userId, "stream_audio");
         }

         await client.voiceManager.applyVoiceState();
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Watching/Listening Stream Failed",
               text: "An unexpected error occurred. Please try again.",
               isOpen: true,
            },
         });

         if (client.voice.transport.getConsumer(userId, "stream_video") || client?.voice.transport.getConsumer(userId, "stream_audio"))
            await unconsumeStream(userId);
      }
   }

   async function unconsumeStream(userId: Snowflake) {
      try {
         const videoConsumer = client?.voice.transport.getConsumer(userId, "stream_video");
         const audioConsumer = client?.voice.transport.getConsumer(userId, "stream_audio");

         if (videoConsumer) {
            await client?.voice.transport.closeConsumer(videoConsumer.id);
         }
         if (audioConsumer) {
            await client?.voice.transport.closeConsumer(audioConsumer.id);
         }
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Unwatching/Unlistening Stream Failed",
               text: "An unexpected error occurred. Please try again.",
               isOpen: true,
            },
         });
      }
   }

   async function changeStream() {
      const audioProducer = client?.voice.transport.getProducer("stream_audio");
      const videoProducer = client?.voice.transport.getProducer("stream_video");

      // Audio Stream
      if (audioProducer && !videoProducer) openAudioStream();
      // Screen Share
      else await openScreenShare();
   }

   async function updateStream(
      video?: { width?: number; height?: number; frameRate?: number; maxBitrate?: number },
      audio?: { maxBitrate?: number },
   ) {
      try {
         if (video) {
            await client?.voice.stream.updateVideoParameters(video);
         }

         if (audio && audio.maxBitrate) {
            await client?.voice.stream.updateAudioBitrate(audio.maxBitrate);
         }
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Updating Stream Failed",
               text: "An unexpected error occurred. Please try again.",
               isOpen: true,
            },
         });
      }
   }

   async function closeStream() {
      try {
         await client?.voice.stream.closeStream();
      } catch (e) {
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
         updateModals({
            info: {
               status: "error",
               title: "Closing Camera Failed",
               text: getMediaErrorMessage(e, "camera"),
               isOpen: true,
            },
         });
      }
   }

   return {
      openCamera,
      openAudioStream,
      openScreenShare,
      changeStream,
      updateStream,
      consumeStream,
      unconsumeStream,
      closeStream,
      closeCamera,
      toggleDeafen,
      toggleMute,
   };
}
