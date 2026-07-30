import { analytics } from "@huginnjs/shared";

import type { VoiceTransportManager } from "./voice-transport-manager";

export class VoiceDeviceManager {
   private transport: VoiceTransportManager;

   public constructor(transport: VoiceTransportManager) {
      this.transport = transport;
   }

   private getDefaultAttributes(): Record<string, string | number | boolean> {
      return {
         "voice.transport.status": this.transport.status,
      };
   }

   public async openMicrophone(track: MediaStreamTrack): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceDevice.openMicrophone", async (span): Promise<void> => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "track.kind": "microphone",
            "track.track_id": track.id,
         });

         await this.transport.createProducer("microphone", track);
      });
   }

   public async replaceMicrophoneTrack(track: MediaStreamTrack): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceDevice.replaceMicrophoneTrack", async (span): Promise<void> => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "track.kind": "microphone",
            "track.track_id": track.id,
         });

         await this.transport.replaceProducerTrack("microphone", track);
      });
   }

   public async closeMicrophone(): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceDevice.closeMicrophone", async (span): Promise<void> => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "track.kind": "microphone",
         });

         await this.transport.closeProducer("microphone");
      });
   }

   public async openCamera(track: MediaStreamTrack): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceDevice.openCamera", async (span): Promise<void> => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "track.kind": "camera",
            "track.track_id": track.id,
         });

         await this.transport.createProducer("camera", track, {
            encodings: [{ scalabilityMode: "L1T3", scaleResolutionDownBy: 1 }],
            codecOptions: { videoGoogleStartBitrate: 1000 },
         });
      });
   }

   public async replaceCameraTrack(track: MediaStreamTrack): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceDevice.replaceCameraTrack", async (span): Promise<void> => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "track.kind": "camera",
            "track.track_id": track.id,
         });

         await this.transport.replaceProducerTrack("camera", track);
      });
   }

   public async closeCamera(): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceDevice.closeCamera", async (span): Promise<void> => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "track.kind": "camera",
         });

         await this.transport.closeProducer("camera");
      });
   }
}
