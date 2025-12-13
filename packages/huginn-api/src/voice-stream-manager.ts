import { log } from "@huginn/shared";
import type { VoiceTransportManager } from "./voice-transport-manager";
import type { RtpEncodingParameters } from "mediasoup-client/types";
import type { VoiceStreamOptions } from ".";

export class VoiceStreamManager {
   private transport: VoiceTransportManager;

   public constructor(transport: VoiceTransportManager) {
      this.transport = transport;
   }

   public async openStream(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack, options?: VoiceStreamOptions): Promise<void> {
      log("api:voice-screen-share", "default", "open stream");

      const maxBitrate = options?.maxVideoBitrate ?? 2000000;
      const scalabilityMode = "L1T3";
      const useSimulcast = options?.useSimulcast ?? true;

      if (videoTrack) {
         // ENCODING ORDERING MATTERS FOR SIMULCAST
         const encodings: RtpEncodingParameters[] = useSimulcast
            ? [
                 { scaleResolutionDownBy: 4, maxBitrate, scalabilityMode },
                 { scaleResolutionDownBy: 2, maxBitrate, scalabilityMode },
                 { scaleResolutionDownBy: 1, maxBitrate, scalabilityMode },
              ]
            : [{ maxBitrate, scalabilityMode }];

         const videoSettings = videoTrack.getSettings();
         if (videoSettings.height && videoSettings.height < 576 && useSimulcast) {
            encodings.shift();
         }

         await this.transport.createProducer("stream_video", videoTrack, { encodings });
      }

      if (audioTrack) {
         await this.transport.createProducer("stream_audio", audioTrack, {
            codecOptions: { opusStereo: true, opusMaxAverageBitrate: 400000 },
         });
      }
   }

   public async replaceStreamVideoTrack(track: MediaStreamTrack): Promise<void> {
      log("api:voice-screen-share", "default", "replace stream video track");

      await this.transport.replaceProducerTrack("stream_video", track);
   }

   public async replaceStreamAudioTrack(track: MediaStreamTrack): Promise<void> {
      log("api:voice-screen-share", "default", "replace stream audio track");

      await this.transport.replaceProducerTrack("stream_audio", track);
   }

   public async closeStreamAudio(): Promise<void> {
      log("api:voice-screen-share", "default", "close stream audio");

      await this.transport.closeProducer("stream_audio");
   }

   public async closeStreamVideo(): Promise<void> {
      log("api:voice-screen-share", "default", "close stream video");

      await this.transport.closeProducer("stream_video");
   }

   public async closeStream(): Promise<void> {
      log("api:voice-screen-share", "default", "close stream");

      const hasAudio = !!this.transport.getProducer("stream_audio");
      const hasVideo = !!this.transport.getProducer("stream_video");

      await Promise.all([hasAudio && this.transport.closeProducer("stream_audio"), hasVideo && this.transport.closeProducer("stream_video")]);
   }
}
