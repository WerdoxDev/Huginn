import type { RtpEncodingParameters } from "mediasoup-client/types";

import { analytics, clamp, CONSTANTS, EventEmitter, recordSpanError } from "@huginnjs/shared";

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

   private getDefaultAttributes() {
      return {
         "voice.transport.status": this.transport.status,
         "voice.stream.has_audio_producer": !!this.transport.getProducer("stream_audio"),
         "voice.stream.has_video_producer": !!this.transport.getProducer("stream_video"),
      };
   }

   public async openStream(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack, options?: VoiceStreamOptions): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.openStream", async (span) => {
         const maxVideoBitrate = clamp(options?.maxVideoBitrate ?? CONSTANTS.DEFAULT_VIDEO_BITRATE, CONSTANTS.MIN_VIDEO_BITRATE, CONSTANTS.MAX_VIDEO_BITRATE);
         const maxAudioBitrate = clamp(options?.maxAudioBitrate ?? CONSTANTS.DEFAULT_AUDIO_BITRATE, CONSTANTS.MIN_AUDIO_BITRATE, CONSTANTS.MAX_AUDIO_BITRATE);
         const scalabilityMode = "L1T3";
         const useSimulcast = options?.useSimulcast ?? true;

         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.stream.has_video_track": !!videoTrack,
            "voice.stream.has_audio_track": !!audioTrack,
            "voice.stream.max_video_bitrate": maxVideoBitrate,
            "voice.stream.max_audio_bitrate": maxAudioBitrate,
            "voice.stream.use_simulcast": useSimulcast,
            "voice.stream.scalability_mode": scalabilityMode,
         });

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
      });
   }

   /**
    * Change resolution and/or framerate of the video track without replacing it
    * @param width - Target width
    * @param height - Target height
    * @param frameRate - Target frame rate
    */
   public async updateVideoConstraints(width?: number, height?: number, frameRate?: number): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.updateVideoConstraints", async (span) => {
         span.setAttributes(this.getDefaultAttributes());
         if (width) span.setAttribute("params.width", width);
         if (height) span.setAttribute("params.height", height);
         if (frameRate) span.setAttribute("params.frame_rate", frameRate);

         try {
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

            constraints.width = width ?? settings.width;
            constraints.height = height ?? settings.height;
            constraints.frameRate = frameRate ?? settings.frameRate;

            await track.applyConstraints(constraints);

            const newSettings = track.getSettings();
            this.emit("video_constraints_updated", {
               width: newSettings.width,
               height: newSettings.height,
               frameRate: newSettings.frameRate,
            });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   /**
    * Update the max bitrate for video producer
    * @param maxBitrate - Maximum bitrate in bps
    */
   public async updateVideoBitrate(maxBitrate: number): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.updateVideoBitrate", async (span) => {
         const clampedBitrate = clamp(maxBitrate, CONSTANTS.MIN_VIDEO_BITRATE, CONSTANTS.MAX_VIDEO_BITRATE);
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.max_bitrate": maxBitrate,
            "params.clamped_bitrate": clampedBitrate,
         });

         try {
            const producer = this.transport.getProducer("stream_video");
            if (!producer) {
               throw new Error("No video producer found");
            }

            const params = producer.rtpSender?.getParameters();

            if (!params) {
               throw new Error("Failed to get RTP parameters");
            }

            // Update encodings based on simulcast configuration
            if (params.encodings.length > 1) {
               params.encodings[0].maxBitrate = clampedBitrate / 3;
               params.encodings[1].maxBitrate = clampedBitrate;
            } else {
               params.encodings[0].maxBitrate = clampedBitrate;
            }

            await producer.rtpSender?.setParameters(params);

            this.emit("video_bitrate_updated", { maxBitrate: clampedBitrate });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   /**
    * Update the max bitrate for audio producer
    * @param maxBitrate - Maximum bitrate in bps
    */
   public async updateAudioBitrate(maxBitrate: number): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.updateAudioBitrate", async (span) => {
         const clampedBitrate = clamp(maxBitrate, CONSTANTS.MIN_AUDIO_BITRATE, CONSTANTS.MAX_AUDIO_BITRATE);
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.max_bitrate": maxBitrate,
            "params.clamped_bitrate": clampedBitrate,
         });

         try {
            const producer = this.transport.getProducer("stream_audio");
            if (!producer) {
               throw new Error("No audio producer found");
            }

            const params = producer.rtpSender?.getParameters();

            if (!params) {
               throw new Error("Failed to get RTP parameters");
            }

            params.encodings[0].maxBitrate = clampedBitrate;

            await producer.rtpSender?.setParameters(params);

            this.emit("audio_bitrate_updated", { maxBitrate: clampedBitrate });
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   /**
    * Update multiple video parameters at once
    * @param options - Combined options for constraints and bitrate
    */
   public async updateVideoParameters(options: { width?: number; height?: number; frameRate?: number; maxBitrate?: number }): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.updateVideoParameters", async (span) => {
         span.setAttributes(this.getDefaultAttributes());
         if (options.width) span.setAttribute("params.width", options.width);
         if (options.height) span.setAttribute("params.height", options.height);
         if (options.frameRate) span.setAttribute("params.frame_rate", options.frameRate);
         if (options.maxBitrate) span.setAttribute("params.max_bitrate", options.maxBitrate);

         const { width, height, frameRate, maxBitrate } = options;

         // Update constraints if any are provided
         if (width !== undefined || height !== undefined || frameRate !== undefined) {
            await this.updateVideoConstraints(width, height, frameRate);
         }

         // Update bitrate if provided
         if (maxBitrate !== undefined) {
            await this.updateVideoBitrate(maxBitrate);
         }
      });
   }

   public async replaceStreamVideoTrack(track: MediaStreamTrack): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.replaceStreamVideoTrack", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.media.kind": "stream_video",
            "voice.track.id": track.id,
            "voice.track.kind": track.kind,
         });

         await this.transport.replaceProducerTrack("stream_video", track);
      });
   }

   public async replaceStreamAudioTrack(track: MediaStreamTrack): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.replaceStreamAudioTrack", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.media.kind": "stream_audio",
            "voice.track.id": track.id,
            "voice.track.kind": track.kind,
         });

         await this.transport.replaceProducerTrack("stream_audio", track);
      });
   }

   public async closeStreamAudio(): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.closeStreamAudio", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.media.kind": "stream_audio",
         });

         await this.transport.closeProducer("stream_audio");
      });
   }

   public async closeStreamVideo(): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.closeStreamVideo", async (span) => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.media.kind": "stream_video",
         });

         await this.transport.closeProducer("stream_video");
      });
   }

   public async closeStream(): Promise<void> {
      return await analytics.startActiveSpan("api.voiceStream.closeStream", async (span) => {
         const hasAudio = !!this.transport.getProducer("stream_audio");
         const hasVideo = !!this.transport.getProducer("stream_video");

         console.log(hasAudio, hasVideo);

         span.setAttributes({
            ...this.getDefaultAttributes(),
            "voice.stream.has_audio": hasAudio,
            "voice.stream.has_video": hasVideo,
         });

         await Promise.all([hasAudio && this.transport.closeProducer("stream_audio"), hasVideo && this.transport.closeProducer("stream_video")]);
      });
   }
}
