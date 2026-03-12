import { log } from "@huginn/shared";

import type { VoiceTransportManager } from "./voice-transport-manager";

export class VoiceDeviceManager {
   private transport: VoiceTransportManager;

   public constructor(transport: VoiceTransportManager) {
      this.transport = transport;
   }

   public async openMicrophone(track: MediaStreamTrack): Promise<void> {
      log("api:voice-device", "default", "open microphone");

      await this.transport.createProducer("microphone", track);
   }

   public async replaceMicrophoneTrack(track: MediaStreamTrack): Promise<void> {
      log("api:voice-device", "default", "replace microphone track");

      await this.transport.replaceProducerTrack("microphone", track);
   }

   public async closeMicrophone(): Promise<void> {
      log("api:voice-device", "default", "close microphone");

      await this.transport.closeProducer("microphone");
   }

   public async openCamera(track: MediaStreamTrack): Promise<void> {
      log("api:voice-device", "default", "open camera");

      await this.transport.createProducer("camera", track, {
         encodings: [{ scalabilityMode: "L1T3", scaleResolutionDownBy: 1 }],
         codecOptions: { videoGoogleStartBitrate: 1000 },
      });
   }

   public async replaceCameraTrack(track: MediaStreamTrack): Promise<void> {
      log("api:voice-device", "default", "replace camera track");

      await this.transport.replaceProducerTrack("camera", track);
   }

   public async closeCamera(): Promise<void> {
      log("api:voice-device", "default", "close camera");

      await this.transport.closeProducer("camera");
   }
}
