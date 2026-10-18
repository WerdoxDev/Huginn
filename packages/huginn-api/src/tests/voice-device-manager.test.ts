import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { audioTrack, createVoiceSession, installVoiceEnvironment, videoTrack } from "./voice-test-utils";

let session: ReturnType<typeof createVoiceSession>;
beforeEach(async () => {
   installVoiceEnvironment();
   session = createVoiceSession();
   await session.manager.connectVoice(null, "channel");
});
afterEach(() => {
   session.voice.signaling.close();
   vi.unstubAllGlobals();
});

describe("voice devices", () => {
   it.each(["microphone", "camera"] as const)("publishes, switches, and closes the %s", async (kind) => {
      const { device, transport } = session.voice;
      const first = kind === "camera" ? videoTrack() : audioTrack();
      const replacement = kind === "camera" ? videoTrack() : audioTrack();
      if (kind === "camera") await device.openCamera(first);
      else await device.openMicrophone(first);
      const producer = transport.getProducer(kind)!;
      expect(producer.track).toBe(first);

      if (kind === "camera") await device.replaceCameraTrack(replacement);
      else await device.replaceMicrophoneTrack(replacement);
      expect(transport.getProducer(kind)).toBe(producer);
      expect(producer.track).toBe(replacement);

      if (kind === "camera") await device.closeCamera();
      else await device.closeMicrophone();
      expect(producer.closed).toBe(true);
      expect(transport.getProducer(kind)).toBeUndefined();
   });
});
