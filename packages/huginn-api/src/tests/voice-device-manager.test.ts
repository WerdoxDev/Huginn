import { beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceDeviceManager } from "../voice-device-manager";
import { VoiceTransportManager } from "./voice-mocks";

let transport: VoiceTransportManager;
let deviceManager: VoiceDeviceManager;

beforeEach(() => {
   vi.restoreAllMocks();
   transport = new VoiceTransportManager();
   deviceManager = new VoiceDeviceManager(transport as any);
});

function makeTrack(id: string): MediaStreamTrack {
   return { id } as MediaStreamTrack;
}

describe("VoiceDeviceManager", () => {
   it("opens and closes the microphone through the transport", async () => {
      const track = makeTrack("microphone-track");

      await deviceManager.openMicrophone(track);
      await deviceManager.replaceMicrophoneTrack(track);
      await deviceManager.closeMicrophone();

      expect(transport.createProducer).toHaveBeenCalledWith("microphone", track);
      expect(transport.replaceProducerTrack).toHaveBeenCalledWith("microphone", track);
      expect(transport.closeProducer).toHaveBeenCalledWith("microphone");
   });

   it("opens and closes the camera through the transport", async () => {
      const track = makeTrack("camera-track");

      await deviceManager.openCamera(track);
      await deviceManager.replaceCameraTrack(track);
      await deviceManager.closeCamera();

      expect(transport.createProducer).toHaveBeenCalledWith(
         "camera",
         track,
         expect.objectContaining({
            codecOptions: { videoGoogleStartBitrate: 1000 },
            encodings: [{ scalabilityMode: "L1T3", scaleResolutionDownBy: 1 }],
         }),
      );
      expect(transport.replaceProducerTrack).toHaveBeenCalledWith("camera", track);
      expect(transport.closeProducer).toHaveBeenCalledWith("camera");
   });

   it("throws an error when transport calls fail", async () => {
      const error = new Error("boom");
      const track = makeTrack("microphone-track");

      transport.createProducer.mockRejectedValueOnce(error);

      await expect(deviceManager.openMicrophone(track)).rejects.toThrow("boom");
   });
});
