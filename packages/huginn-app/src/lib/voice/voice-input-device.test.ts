import type { HuginnClient } from "@huginnjs/api";

import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/types";

import { AudioLevelChecker } from "./audio-level-checker";
import { VoiceInputDevice } from "./voice-input-device";

class MockAudioNode {
   connect = vi.fn(() => this);
   disconnect = vi.fn(() => this);
}

class MockGainNode extends MockAudioNode {
   gain = { value: 1 };
}

function createMockTrack(): MediaStreamTrack {
   return {
      stop: vi.fn(),
      clone: vi.fn(() => createMockTrack()),
   } as unknown as MediaStreamTrack;
}

function createMockMediaStream(trackCount = 1): MediaStream {
   const tracks = Array.from({ length: trackCount }, () => createMockTrack());
   return {
      getAudioTracks: vi.fn(() => tracks),
      getTracks: vi.fn(() => tracks),
      clone: vi.fn(() => createMockMediaStream(trackCount)),
   } as unknown as MediaStream;
}

class MockAudioContext {
   static instances: MockAudioContext[] = [];

   public source = new MockAudioNode();
   public gainNode = new MockGainNode();
   public destinationStream = createMockMediaStream();
   public destination = Object.assign(new MockAudioNode(), { stream: this.destinationStream });
   public audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };

   public createMediaStreamSource = vi.fn(() => this.source);
   public createGain = vi.fn(() => this.gainNode);
   public createMediaStreamDestination = vi.fn(() => this.destination);
   public close = vi.fn().mockResolvedValue(undefined);

   constructor() {
      MockAudioContext.instances.push(this);
   }
}

class MockAudioWorkletNode {
   public port = { onmessage: undefined as ((event: MessageEvent<number>) => void) | undefined, close: vi.fn() };
   public connect = vi.fn(() => this);
   public disconnect = vi.fn();
}

function createMockClient(options: { userId?: string | null; isMuted?: boolean } = {}) {
   const { userId = "user-1", isMuted = false } = options;

   return {
      currentUser: userId ? { id: userId } : undefined,
      voiceManager: {
         voiceState: {
            updateLocalVoiceState: vi.fn(),
            gatewayVoiceState: { isAudioMuted: isMuted },
         },
      },
   } as unknown as HuginnClient;
}

let getUserMediaMock: ReturnType<typeof vi.fn>;
let currentTime: number;

beforeEach(() => {
   MockAudioContext.instances = [];
   currentTime = 0;
   getUserMediaMock = vi.fn().mockImplementation(async () => createMockMediaStream());

   vi.stubGlobal("AudioContext", MockAudioContext);
   vi.stubGlobal("AudioWorkletNode", MockAudioWorkletNode);
   Object.defineProperty(globalThis.navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
   });
   vi.spyOn(performance, "now").mockImplementation(() => currentTime);

   storageStore.getState().setCachedValue("settings", { inputThreshold: -50 } as AppSettings);
   vi.spyOn(storageStore, "getState");
   vi.spyOn(voiceStore, "getState");
   vi.mocked(voiceStore.getState).mockReturnValue({
      updateSpeakingState: vi.fn(),
   } as unknown as ReturnType<typeof voiceStore.getState>);
});

afterEach(() => {
   VoiceInputDevice.close();
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

describe("getStream", () => {
   it("opens user media with the expected constraints", async () => {
      await VoiceInputDevice.getStream("device-123", 80, true);

      expect(getUserMediaMock).toHaveBeenCalledWith({
         audio: {
            deviceId: "device-123",
            sampleRate: 48000,
            channelCount: 2,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
         },
      });
   });

   it("wires one shared source through gain and returns the shared output", async () => {
      const result = await VoiceInputDevice.getStream("device-123", 50, true);
      const context = MockAudioContext.instances[0];

      expect(context.createMediaStreamSource).toHaveBeenCalledWith(VoiceInputDevice.currentStream);
      expect(context.source.connect).toHaveBeenCalledWith(context.gainNode);
      expect(context.gainNode.connect).toHaveBeenCalledWith(context.destination);
      expect(context.gainNode.gain.value).toBe(0.5);
      expect(result).toBe(context.destinationStream);
   });

   it("returns the same output without reopening matching input options", async () => {
      const first = await VoiceInputDevice.getStream("device-123", 50, true);
      const second = await VoiceInputDevice.getStream("device-123", 50, true);

      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
      expect(MockAudioContext.instances).toHaveLength(1);
      expect(first).toBe(second);
   });

   it("shares an in-flight open between concurrent matching requests", async () => {
      const requests = [VoiceInputDevice.getStream("device-123", 50, true), VoiceInputDevice.getStream("device-123", 50, true)];

      const [first, second] = await Promise.all(requests);

      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);
   });

   it.each([
      ["device", ["device-2", 50, true]],
      ["noise suppression", ["device-1", 50, false]],
   ] as const)("globally replaces the navigator stream when the %s changes", async (_name, options) => {
      const output = await VoiceInputDevice.getStream("device-1", 50, true);
      const firstInputTrack = VoiceInputDevice.currentStream!.getTracks()[0];

      const replacedOutput = await VoiceInputDevice.getStream(options[0], options[1], options[2]);

      expect(firstInputTrack.stop).toHaveBeenCalledTimes(1);
      expect(getUserMediaMock).toHaveBeenCalledTimes(2);
      expect(MockAudioContext.instances).toHaveLength(1);
      expect(replacedOutput).toBe(output);
   });

   it("changes volume globally without reopening the navigator stream", async () => {
      const output = await VoiceInputDevice.getStream("device-1", 50, true);

      const sameOutput = await VoiceInputDevice.getStream("device-1", 60, true);

      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
      expect(MockAudioContext.instances[0].gainNode.gain.value).toBe(0.6);
      expect(sameOutput).toBe(output);
   });

   it("allows a retry with different options when opening fails", async () => {
      getUserMediaMock.mockRejectedValueOnce(new Error("permission denied"));

      await expect(VoiceInputDevice.getStream("device-1", 50, true)).rejects.toThrow("permission denied");
      await expect(VoiceInputDevice.getStream("device-2", 60, false)).resolves.toBeDefined();
   });
});

describe("close", () => {
   it("stops the shared streams and tears down the audio graph", async () => {
      await VoiceInputDevice.getStream("device-1", 50, true);
      const context = MockAudioContext.instances[0];
      const inputTrack = VoiceInputDevice.currentStream!.getTracks()[0];
      const destinationTrack = context.destinationStream.getTracks()[0];

      VoiceInputDevice.close();

      expect(inputTrack.stop).toHaveBeenCalledTimes(1);
      expect(destinationTrack.stop).toHaveBeenCalledTimes(1);
      expect(context.source.disconnect).toHaveBeenCalledTimes(1);
      expect(context.gainNode.disconnect).toHaveBeenCalledTimes(1);
      expect(context.destination.disconnect).toHaveBeenCalledTimes(1);
      expect(context.close).toHaveBeenCalledTimes(1);
      expect(VoiceInputDevice.currentStream).toBeUndefined();
   });

   it("does not throw before the input is initialized", () => {
      expect(() => VoiceInputDevice.close()).not.toThrow();
   });
});

describe("setGain", () => {
   it("updates the shared gain", async () => {
      await VoiceInputDevice.getStream("device-1", 50, true);

      VoiceInputDevice.setGain(75);

      expect(MockAudioContext.instances[0].gainNode.gain.value).toBe(0.75);
   });

   it("does not throw before getStream", () => {
      expect(() => VoiceInputDevice.setGain(75)).not.toThrow();
   });
});

describe("initializeAudioLevel setup", () => {
   it("throws if getStream has not been called first", async () => {
      await expect(VoiceInputDevice.initializeAudioLevel(createMockClient())).rejects.toThrow("must be opened before audio-level checking");
   });

   it("uses the shared output without opening another input", async () => {
      const startSpy = vi.spyOn(AudioLevelChecker.prototype, "startChecking");
      await VoiceInputDevice.getStream("device-1", 40, true);
      const destinationStream = MockAudioContext.instances[0].destinationStream;

      await VoiceInputDevice.initializeAudioLevel(createMockClient());

      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
      expect(startSpy).toHaveBeenCalledWith(destinationStream);
   });

   it("stops the previous checker on re-initialization", async () => {
      const stopSpy = vi.spyOn(AudioLevelChecker.prototype, "stopChecking");
      await VoiceInputDevice.getStream("device-1", 40, true);
      await VoiceInputDevice.initializeAudioLevel(createMockClient());

      await VoiceInputDevice.initializeAudioLevel(createMockClient());

      expect(stopSpy).toHaveBeenCalledTimes(1);
   });
});

function getAudioLevelChecker() {
   return (VoiceInputDevice as unknown as { audioLevel: AudioLevelChecker }).audioLevel;
}

function emitLevel(db: number) {
   getAudioLevelChecker().onAudioLevel!(db);
}

async function setUpDevice(client: HuginnClient) {
   await VoiceInputDevice.getStream("device-1", 50, true);
   await VoiceInputDevice.initializeAudioLevel(client);
}

describe("initializeAudioLevel VAD logic", () => {
   it("stays silent inside the hysteresis gap", async () => {
      const client = createMockClient();
      await setUpDevice(client);

      emitLevel(-55);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).not.toHaveBeenCalled();
      expect(voiceStore.getState().updateSpeakingState).not.toHaveBeenCalled();
   });

   it("starts speaking at the open threshold without repeating the event", async () => {
      const client = createMockClient();
      await setUpDevice(client);

      emitLevel(-40);
      emitLevel(-35);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledTimes(1);
      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledWith({ isAudioPaused: false });
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledWith("user-1", true);
   });

   it("extends the hangover while the level remains above the close threshold", async () => {
      const client = createMockClient();
      await setUpDevice(client);

      currentTime = 0;
      emitLevel(-40);
      currentTime = 40;
      emitLevel(-55);
      currentTime = 45;
      emitLevel(-65);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledTimes(1);
   });

   it("stops speaking below the close threshold after the hangover", async () => {
      const client = createMockClient();
      await setUpDevice(client);

      currentTime = 0;
      emitLevel(-40);
      currentTime = 95;
      emitLevel(-65);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenLastCalledWith({ isAudioPaused: true });
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenLastCalledWith("user-1", false);
   });

   it("immediately stops speaking when muted and does not repeat while muted", async () => {
      const client = createMockClient();
      await setUpDevice(client);

      emitLevel(-40);
      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = true;
      emitLevel(-40);
      emitLevel(-40);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledTimes(2);
      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenLastCalledWith({ isAudioPaused: true });
   });

   it("does not resume speaking on the unmute reading itself", async () => {
      const client = createMockClient();
      await setUpDevice(client);

      emitLevel(-70);
      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = true;
      emitLevel(-70);
      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = false;
      emitLevel(-40);

      expect(voiceStore.getState().updateSpeakingState).not.toHaveBeenCalled();

      emitLevel(-40);
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledWith("user-1", true);
   });

   it("uses an empty user ID when the client has no current user", async () => {
      const client = createMockClient({ userId: null });
      await setUpDevice(client);

      emitLevel(-40);

      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledWith("", true);
   });
});
