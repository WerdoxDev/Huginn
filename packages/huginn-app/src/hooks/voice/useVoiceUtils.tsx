import { useFullscreen } from "@hooks/useFullscreen";
import { analytics, type Snowflake } from "@huginnjs/shared";
import { getMediaErrorMessage } from "@lib/utils";
import { VoiceClient } from "@lib/voice/voice-client";
import { useModals } from "@stores/modalsStore";
import { useStorage } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";

import type { MediaSource } from "@/types";

import { useVoiceSnapshot } from "./useMediaSources";

export function useVoiceUtils() {
   const settings = useStorage("settings");
   const { mediaSources } = useVoiceSnapshot();
   const { isFullscreen, toggleFullscreen } = useFullscreen();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();

   function getVoiceHost() {
      const hostId = VoiceClient.getHostId();
      const localHost = window.voiceHost;
      if (localHost && localHost.hostId === hostId) return localHost;

      const openerHost = (window.opener as Window)?.voiceHost;
      if (openerHost && openerHost.hostId === hostId) return openerHost;

      throw new Error("The voice host window is unavailable");
   }

   async function toggleMute() {
      await VoiceClient.sendMessage("toggle_mute");
   }

   async function toggleDeafen() {
      await VoiceClient.sendMessage("toggle_deafen");
   }

   async function openScreenShare() {
      const videoProducer = mediaSources.find((source) => source.kind === "stream_video" && source.type === "producing");

      try {
         if (isFullscreen) toggleFullscreen();

         if (huginnWindow.environment === "browser") {
            const stream = await navigator.mediaDevices.getDisplayMedia({
               audio: true,
               video: true,
            });
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];

            await getVoiceHost().openStream(videoTrack, audioTrack);
         } else {
            updateModals({
               screenShare: {
                  isOpen: true,
                  type: videoProducer ? "change" : "create",
                  callback: async (options) => {
                     try {
                        await getVoiceHost().openCapturedStream(options);
                     } catch (e) {
                        updateModals({
                           info: {
                              status: "error",
                              title: "Screen Sharing Failed",
                              text: getMediaErrorMessage(e, "screen"),
                              isOpen: true,
                           },
                        });

                        analytics.log({ level: "error", body: "failed to open screen share", exception: e, attributes: { options } });

                        await VoiceClient.sendMessage("close_stream").catch(() => undefined);
                     }
                  },
                  errback: ({ error }) => {
                     updateModals({
                        info: {
                           status: "error",
                           title: "Screen Sharing Failed",
                           text: getMediaErrorMessage(error, "screen"),
                           isOpen: true,
                        },
                     });

                     analytics.log({ level: "error", body: "failed to open screen share", exception: error });
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

         analytics.log({ level: "error", body: "failed to open screen share", exception: e });

         await VoiceClient.sendMessage("close_stream").catch(() => undefined);
      }
   }

   function openAudioStream() {
      if (isFullscreen) {
         toggleFullscreen();
      }

      if (huginnWindow.environment !== "desktop") return;

      updateModals({
         audioStream: {
            isOpen: true,
            callback: async (options) => {
               try {
                  await VoiceClient.sendMessage("open_audio_stream", options);
               } catch (e) {
                  updateModals({
                     info: {
                        status: "error",
                        title: "Audio Stream Failed",
                        text: getMediaErrorMessage(e, "audio"),
                        isOpen: true,
                     },
                  });

                  analytics.log({ level: "error", body: "failed to open audio stream", exception: e, attributes: { options } });

                  await VoiceClient.sendMessage("close_stream").catch(() => undefined);
               }
            },
            errback: ({ error }) => {
               updateModals({
                  info: {
                     status: "error",
                     title: "Audio Stream Failed",
                     text: getMediaErrorMessage(error, "audio"),
                     isOpen: true,
                  },
               });

               analytics.log({ level: "error", body: "failed to open audio stream", exception: error });
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

         await getVoiceHost().openCamera(track);
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Opening Camera Failed",
               text: getMediaErrorMessage(e, "camera"),
               isOpen: true,
            },
         });

         analytics.log({ level: "error", body: "failed to open camera", exception: e });

         await VoiceClient.sendMessage("close_camera").catch(() => undefined);
      }
   }

   async function consumeStream(userId: Snowflake, guildId: Snowflake | null, channelId: Snowflake) {
      try {
         await VoiceClient.sendMessage("consume_stream", { userId, guildId, channelId });
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Watching/Listening Stream Failed",
               text: getMediaErrorMessage(e),
               isOpen: true,
            },
         });

         analytics.log({ level: "error", body: "failed to consume stream", exception: e, attributes: { userId, guildId, channelId } });

         await VoiceClient.sendMessage("unconsume_stream", { userId }).catch(() => undefined);
      }
   }

   async function unconsumeStream(userId: Snowflake) {
      try {
         await VoiceClient.sendMessage("unconsume_stream", { userId });
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Unwatching/Unlistening Stream Failed",
               text: "An unexpected error occurred. Please try again.",
               isOpen: true,
            },
         });

         analytics.log({ level: "error", body: "failed to unconsume stream", exception: e, attributes: { userId } });
      }
   }

   async function changeStream() {
      const audioProducer = mediaSources.find((source) => source.kind === "stream_audio" && source.type === "producing");
      const videoProducer = mediaSources.find((source) => source.kind === "stream_video" && source.type === "producing");

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
         await VoiceClient.sendMessage("update_stream", { video, audio });
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Updating Stream Failed",
               text: "An unexpected error occurred. Please try again.",
               isOpen: true,
            },
         });

         analytics.log({ level: "error", body: "failed to update stream", exception: e, attributes: { video, audio } });
      }
   }

   async function closeStream() {
      try {
         await VoiceClient.sendMessage("close_stream");
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Closing Screen Sharing Failed",
               text: getMediaErrorMessage(e, "screen"),
               isOpen: true,
            },
         });

         analytics.log({ level: "error", body: "failed to close stream", exception: e });
      }
   }

   async function closeCamera() {
      try {
         await VoiceClient.sendMessage("close_camera");
      } catch (e) {
         updateModals({
            info: {
               status: "error",
               title: "Closing Camera Failed",
               text: getMediaErrorMessage(e, "camera"),
               isOpen: true,
            },
         });

         analytics.log({ level: "error", body: "failed to close camera", exception: e });
      }
   }

   async function openPopout() {
      await VoiceClient.sendMessage("open_popout");
   }

   async function openMediaPopout(mediaSource: MediaSource) {
      await VoiceClient.sendMessage("open_media_popout", mediaSource);
   }

   async function focusMediaPopout(producerId: string) {
      await VoiceClient.sendMessage("focus_media_popout", producerId);
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
      openPopout,
      openMediaPopout,
      focusMediaPopout,
   };
}
