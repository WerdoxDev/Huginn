import { log } from "@huginn/shared";
import type { VoiceTransportManager } from "./voice-transport-manager";

export class VoiceStreamManager {
   private transport: VoiceTransportManager;

   public constructor(transport: VoiceTransportManager) {
      this.transport = transport;
   }

   public async openStream(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
      log("api:voice-screen-share", "default", "open stream");

      if (videoTrack) {
         await this.transport.createProducer("stream_video", videoTrack, {
            encodings: [{ scalabilityMode: "L1T3" }],
            codecOptions: { videoGoogleStartBitrate: 1000000, videoGoogleMinBitrate: 10000, videoGoogleMaxBitrate: 3000000 },
         });
      }

      if (audioTrack) {
         await this.transport.createProducer("stream_audio", audioTrack, {
            codecOptions: { opusStereo: true, opusMaxAverageBitrate: 1000000 },
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
