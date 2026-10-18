import type { HuginnClient } from "@huginnjs/api";

import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { windowStore } from "@stores/windowStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceInputDevice } from "./voice-input-device";

function track(): MediaStreamTrack {
   return { kind: "audio", enabled: true, stop: vi.fn(), clone: () => track() } as unknown as MediaStreamTrack;
}

class InputStream {
   constructor(private tracks = [track()]) {}
   getTracks() {
      return this.tracks;
   }
   getAudioTracks() {
      return this.tracks;
   }
}

class InputContext {
   static instances: InputContext[] = [];
   gainNode = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
   output = new InputStream();
   createGain = () => this.gainNode;
   createMediaStreamSource = () => ({ connect: (node: unknown) => node, disconnect: vi.fn() });
   createMediaStreamDestination = () => ({ stream: this.output, disconnect: vi.fn() });
   audioWorklet = { addModule: async () => {} };
   destination = {};
   close = vi.fn();
   resume = vi.fn();

   constructor() {
      InputContext.instances.push(this);
   }
}

class LevelWorklet {
   static instances: LevelWorklet[] = [];
   port = { onmessage: null as ((event: MessageEvent<number>) => void) | null, close: vi.fn() };
   connect = vi.fn();
   disconnect = vi.fn();
   constructor() {
      LevelWorklet.instances.push(this);
   }
   emit(db: number) {
      this.port.onmessage?.({ data: db } as MessageEvent<number>);
   }
}

let getUserMedia: ReturnType<typeof vi.fn>;
let now: number;

beforeEach(() => {
   InputContext.instances = [];
   LevelWorklet.instances = [];
   now = 0;
   getUserMedia = vi.fn(async () => new InputStream());
   vi.stubGlobal("AudioContext", InputContext);
   vi.stubGlobal("AudioWorkletNode", LevelWorklet);
   vi.stubGlobal("MediaStream", InputStream);
   vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
   vi.spyOn(performance, "now").mockImplementation(() => now);
   windowStore.setState({ environment: "browser" });
   const settings = storageStore.getState().getCachedValue("settings");
   storageStore.getState().setCachedValue("settings", { ...settings, inputThreshold: -50 });
   voiceStore.getState().clearSpeakingStates();
});

afterEach(() => {
   VoiceInputDevice.close();
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

describe("shared microphone", () => {
   it("uses the selected microphone and suppression setting", async () => {
      await VoiceInputDevice.getStream("headset", 80, false);

      expect(getUserMedia).toHaveBeenCalledWith({ audio: expect.objectContaining({ deviceId: "headset", noiseSuppression: false }) });
   });

   it("uses Android's communication input instead of a desktop device", async () => {
      windowStore.setState({ environment: "android" });

      await VoiceInputDevice.getStream("desktop-device", 80, true);

      const constraints = getUserMedia.mock.calls[0][0] as MediaStreamConstraints;
      expect(constraints.audio).toMatchObject({ channelCount: 1 });
      expect(constraints.audio).not.toHaveProperty("deviceId");
   });

   it("shares simultaneous requests and adjusts volume without reopening the microphone", async () => {
      const [first, second] = await Promise.all([VoiceInputDevice.getStream("headset", 50, true), VoiceInputDevice.getStream("headset", 50, true)]);
      const adjusted = await VoiceInputDevice.getStream("headset", 75, true);

      expect(first).toBe(second);
      expect(adjusted).toBe(first);
      expect(getUserMedia).toHaveBeenCalledOnce();
      expect(InputContext.instances[0].gainNode.gain.value).toBe(0.75);
      VoiceInputDevice.setGain(0);
      expect(InputContext.instances[0].gainNode.gain.value).toBe(0);
   });

   it.each([
      ["device", "other-microphone", true],
      ["suppression", "headset", false],
   ] as const)("releases the old input and keeps the output stream stable when %s changes", async (_name, device, suppression) => {
      const first = await VoiceInputDevice.getStream("headset", 50, true);
      const original = await getUserMedia.mock.results[0].value;

      const second = await VoiceInputDevice.getStream(device, 50, suppression);

      expect(second).toBe(first);
      expect(original.getTracks()[0].stop).toHaveBeenCalled();
      expect(getUserMedia).toHaveBeenLastCalledWith({ audio: expect.objectContaining({ deviceId: device, noiseSuppression: suppression }) });
   });

   it("can retry after microphone permission is denied", async () => {
      getUserMedia.mockRejectedValueOnce(new Error("permission denied"));
      await expect(VoiceInputDevice.getStream("headset", 50, true)).rejects.toThrow("permission denied");

      await expect(VoiceInputDevice.getStream("headset", 50, true)).resolves.toBeDefined();
   });

   it("releases capture only after the last owner leaves", async () => {
      const releaseCall = VoiceInputDevice.acquire();
      const releaseSettings = VoiceInputDevice.acquire();
      const output = await VoiceInputDevice.getStream("headset", 50, true);
      const input = await getUserMedia.mock.results[0].value;

      releaseCall();
      expect(input.getTracks()[0].stop).not.toHaveBeenCalled();
      releaseSettings();
      releaseSettings();
      expect(input.getTracks()[0].stop).toHaveBeenCalledOnce();
      expect(output.getTracks()[0].stop).toHaveBeenCalledOnce();
      expect(InputContext.instances[0].close).toHaveBeenCalledOnce();
   });

   it("releases a microphone that finishes opening after the call closes", async () => {
      const pending = Promise.withResolvers<InputStream>();
      getUserMedia.mockReturnValueOnce(pending.promise);
      const opening = VoiceInputDevice.getStream("headset", 50, true);
      const rejected = expect(opening).rejects.toThrow(/closed/);

      VoiceInputDevice.close();
      const lateStream = new InputStream();
      pending.resolve(lateStream);

      await rejected;
      expect(lateStream.getTracks()[0].stop).toHaveBeenCalled();
   });
});

async function startSpeakingDetection() {
   const client = {
      currentUser: { id: "self" },
      voiceManager: { voiceState: { gatewayVoiceState: { isAudioMuted: false }, updateLocalVoiceState: vi.fn() } },
   };
   await VoiceInputDevice.getStream("headset", 50, true);
   await VoiceInputDevice.initializeAudioLevel(client as unknown as HuginnClient);
   await vi.waitFor(() => expect(LevelWorklet.instances.at(-1)?.port.onmessage).toBeTypeOf("function"));
   return { client, level: LevelWorklet.instances.at(-1)! };
}

describe("speaking detection", () => {
   it("shows speech immediately, holds through brief pauses, and clears after silence", async () => {
      const { client, level } = await startSpeakingDetection();
      level.emit(-55);
      expect(voiceStore.getState().speakingStates).toEqual([]);

      level.emit(-40);
      expect(voiceStore.getState().speakingStates).toContainEqual({ userId: "self", speaking: true });
      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenLastCalledWith({ isAudioPaused: false });
      now = 20;
      level.emit(-70);
      expect(voiceStore.getState().speakingStates).toContainEqual({ userId: "self", speaking: true });
      now = 100;
      level.emit(-70);
      expect(voiceStore.getState().speakingStates).toContainEqual({ userId: "self", speaking: false });
      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenLastCalledWith({ isAudioPaused: true });
   });

   it("stays silent while muted and detects speech again after unmuting", async () => {
      const { client, level } = await startSpeakingDetection();
      level.emit(-30);
      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = true;
      level.emit(-30);
      level.emit(-30);
      expect(voiceStore.getState().speakingStates).toContainEqual({ userId: "self", speaking: false });

      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = false;
      level.emit(-30);
      level.emit(-30);
      expect(voiceStore.getState().speakingStates).toContainEqual({ userId: "self", speaking: true });
   });
});
