import type { RtpEncodingParameters } from "mediasoup-client/types";

import { clamp, CONSTANTS, EventEmitter, log } from "@huginn/shared";

import type { VoiceStreamOptions } from ".";
import type { VoiceTransportManager } from "./voice-transport-manager";

type Events = {
   video_constraints_updated: { width?: number; height?: number; frameRate?: number };
   video_bitrate_updated: { maxBitrate: number };
   audio_bitrate_updated: { maxBitrate: number };
};

export class VoiceStreamManager extends EventEmitter<Events> {
   private transport: VoiceTransportManager;

   public constructor(transport: VoiceTransportManager) {
      super();
      this.transport = transport;
   }

   public async openStream(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack, options?: VoiceStreamOptions): Promise<void> {
      log("api:voice-stream", "default", "open stream");
      const maxVideoBitrate = clamp(
         options?.maxVideoBitrate ?? CONSTANTS.DEFAULT_VIDEO_BITRATE,
         CONSTANTS.MIN_VIDEO_BITRATE,
         CONSTANTS.MAX_VIDEO_BITRATE,
      );
      const maxAudioBitrate = clamp(
         options?.maxAudioBitrate ?? CONSTANTS.DEFAULT_AUDIO_BITRATE,
         CONSTANTS.MIN_AUDIO_BITRATE,
         CONSTANTS.MAX_AUDIO_BITRATE,
      );
      const scalabilityMode = "L1T3";
      const useSimulcast = options?.useSimulcast ?? true;

      if (videoTrack) {
         // ENCODING ORDERING MATTERS FOR SIMULCAST
         const encodings: RtpEncodingParameters[] = useSimulcast
            ? [
                 { scaleResolutionDownBy: 3, maxBitrate: maxVideoBitrate / 3, scalabilityMode },
                 { scaleResolutionDownBy: 1, maxBitrate: maxVideoBitrate, scalabilityMode },
              ]
            : [{ scaleResolutionDownBy: 1, maxBitrate: maxVideoBitrate, scalabilityMode }];
         await this.transport.createProducer("stream_video", videoTrack, {
            encodings,
            codecOptions: { videoGoogleStartBitrate: 1000 },
         });
      }

      if (audioTrack) {
         await this.transport.createProducer("stream_audio", audioTrack, {
            encodings: [{ maxBitrate: maxAudioBitrate }],
            codecOptions: { opusStereo: true },
         });
      }
   }

   /**
    * Change resolution and/or framerate of the video track without replacing it
    * @param width - Target width
    * @param height - Target height
    * @param frameRate - Target frame rate
    */
   public async updateVideoConstraints(width?: number, height?: number, frameRate?: number): Promise<void> {
      log("api:voice-stream", "default", "update video constraints");

      const producer = this.transport.getProducer("stream_video");
      if (!producer) {
         throw new Error("No video producer found");
      }

      const track = producer.track;
      if (!track) {
         throw new Error("No video track found on producer");
      }

      const settings = track.getSettings();
      const constraints: MediaTrackConstraints = {};
      // if (width !== undefined || height !== undefined) {
      constraints.width = width ?? settings.width;
      constraints.height = height ?? settings.height;
      // }
      // if (frameRate !== undefined) {
      constraints.frameRate = frameRate ?? settings.frameRate;
      // }

      await track.applyConstraints(constraints);
      log("api:voice-stream", "default", `video constraints updated: ${JSON.stringify(constraints)}`);

      const newSettings = track.getSettings();
      this.emit("video_constraints_updated", {
         width: newSettings.width,
         height: newSettings.height,
         frameRate: newSettings.frameRate,
      });
   }

   /**
    * Update the max bitrate for video producer
    * @param maxBitrate - Maximum bitrate in bps
    */
   public async updateVideoBitrate(maxBitrate: number): Promise<void> {
      log("api:voice-stream", "default", "update video bitrate");

      const producer = this.transport.getProducer("stream_video");
      if (!producer) {
         throw new Error("No video producer found");
      }

      const clampedBitrate = clamp(maxBitrate, CONSTANTS.MIN_VIDEO_BITRATE, CONSTANTS.MAX_VIDEO_BITRATE);
      const params = producer.rtpSender?.getParameters();

      if (!params) {
         throw new Error("Failed to get RTP parameters");
      }

      // Update encodings based on simulcast configuration
      if (params.encodings.length > 1) {
         params.encodings[0].maxBitrate = clampedBitrate / 3;
         params.encodings[1].maxBitrate = clampedBitrate;
      } else if (params.encodings.length > 0) {
         params.encodings[0].maxBitrate = clampedBitrate;
      }

      await producer.rtpSender?.setParameters(params);
      log("api:voice-stream", "default", `video bitrate updated to: ${clampedBitrate}`);

      this.emit("video_bitrate_updated", { maxBitrate: clampedBitrate });
   }

   /**
    * Update the max bitrate for audio producer
    * @param maxBitrate - Maximum bitrate in bps
    */
   public async updateAudioBitrate(maxBitrate: number): Promise<void> {
      log("api:voice-stream", "default", "update audio bitrate");

      const producer = this.transport.getProducer("stream_audio");
      if (!producer) {
         throw new Error("No audio producer found");
      }

      const clampedBitrate = clamp(maxBitrate, CONSTANTS.MIN_AUDIO_BITRATE, CONSTANTS.MAX_AUDIO_BITRATE);
      const params = producer.rtpSender?.getParameters();

      if (!params) {
         throw new Error("Failed to get RTP parameters");
      }

      if (params.encodings.length > 0) {
         params.encodings[0].maxBitrate = clampedBitrate;
      }

      await producer.rtpSender?.setParameters(params);
      log("api:voice-stream", "default", `audio bitrate updated to: ${clampedBitrate}`);

      this.emit("audio_bitrate_updated", { maxBitrate: clampedBitrate });
   }

   /**
    * Update multiple video parameters at once
    * @param options - Combined options for constraints and bitrate
    */
   public async updateVideoParameters(options: { width?: number; height?: number; frameRate?: number; maxBitrate?: number }): Promise<void> {
      log("api:voice-stream", "default", "update video parameters");

      const { width, height, frameRate, maxBitrate } = options;

      // Update constraints if any are provided
      if (width !== undefined || height !== undefined || frameRate !== undefined) {
         await this.updateVideoConstraints(width, height, frameRate);
      }

      // Update bitrate if provided
      if (maxBitrate !== undefined) {
         await this.updateVideoBitrate(maxBitrate);
      }
   }

   public async replaceStreamVideoTrack(track: MediaStreamTrack): Promise<void> {
      log("api:voice-stream", "default", "replace stream video track");
      await this.transport.replaceProducerTrack("stream_video", track);
   }

   public async replaceStreamAudioTrack(track: MediaStreamTrack): Promise<void> {
      log("api:voice-stream", "default", "replace stream audio track");
      await this.transport.replaceProducerTrack("stream_audio", track);
   }

   public async closeStreamAudio(): Promise<void> {
      log("api:voice-stream", "default", "close stream audio");
      await this.transport.closeProducer("stream_audio");
   }

   public async closeStreamVideo(): Promise<void> {
      log("api:voice-stream", "default", "close stream video");
      await this.transport.closeProducer("stream_video");
   }

   public async closeStream(): Promise<void> {
      log("api:voice-stream", "default", "close stream");
      const hasAudio = !!this.transport.getProducer("stream_audio");
      const hasVideo = !!this.transport.getProducer("stream_video");
      await Promise.all([hasAudio && this.transport.closeProducer("stream_audio"), hasVideo && this.transport.closeProducer("stream_video")]);
   }
}
