import type { HuginnClient } from "@huginnjs/api";

import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/types";

import { AudioLevelChecker } from "./audio-level-checker";
import { VoiceInputDevice } from "./voice-input-device";

// --- Web Audio / MediaDevices mocks ------------------------------------

class MockAudioNode {
   connect = vi.fn(() => this);
   disconnect = vi.fn(() => this);
}

class MockGainNode extends MockAudioNode {
   gain = { value: 1 };
}

function createMockTrack() {
   return { stop: vi.fn() } as unknown as MediaStreamTrack;
}

function createMockMediaStream(trackCount = 1) {
   const tracks = Array.from({ length: trackCount }, () => createMockTrack());
   return {
      getAudioTracks: vi.fn(() => tracks),
      getTracks: vi.fn(() => tracks),
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
   public connect = vi.fn();
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
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

// --- getStream ----------------------------------------------------------

describe("getStream", () => {
   it("requests user media with the expected constraints", async () => {
      const device = new VoiceInputDevice(createMockClient());

      await device.getStream("device-123", 80, true);

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

   it("mirrors noiseSuppression into both echoCancellation and noiseSuppression constraints", async () => {
      const device = new VoiceInputDevice(createMockClient());

      await device.getStream("device-123", 80, false);

      expect(getUserMediaMock).toHaveBeenCalledWith(
         expect.objectContaining({
            audio: expect.objectContaining({ echoCancellation: false, noiseSuppression: false }),
         }),
      );
   });

   it("wires source -> gain -> destination and returns the destination stream", async () => {
      const device = new VoiceInputDevice(createMockClient());

      const result = await device.getStream("device-123", 50, true);

      const ctx = MockAudioContext.instances[0];
      expect(ctx.createMediaStreamSource).toHaveBeenCalledWith(device.currentStream);
      expect(ctx.source.connect).toHaveBeenCalledWith(ctx.gainNode);
      expect(ctx.gainNode.connect).toHaveBeenCalledWith(ctx.destination);
      expect(result).toBe(ctx.destination.stream);
   });

   it("applies the initial gain from volumePercentage", async () => {
      const device = new VoiceInputDevice(createMockClient());

      await device.getStream("device-123", 30, true);

      const ctx = MockAudioContext.instances[0];
      expect(ctx.gainNode.gain.value).toBe(0.3);
   });

   it("stores the new stream on currentStream", async () => {
      const device = new VoiceInputDevice(createMockClient());
      const stream = createMockMediaStream();
      getUserMediaMock.mockResolvedValueOnce(stream);

      await device.getStream("device-123", 50, true);

      expect(device.currentStream).toBe(stream);
   });

   it("tears down the previous audio graph and stops the previous track when called again", async () => {
      const device = new VoiceInputDevice(createMockClient());

      await device.getStream("device-1", 50, true);
      const firstCtx = MockAudioContext.instances[0];
      const firstStream = device.currentStream!;
      const firstTrack = firstStream.getAudioTracks()[0];

      await device.getStream("device-2", 60, false);

      expect(firstCtx.gainNode.disconnect).toHaveBeenCalled();
      expect(firstCtx.destination.disconnect).toHaveBeenCalled();
      expect(firstCtx.source.disconnect).toHaveBeenCalled();
      expect(firstCtx.close).toHaveBeenCalled();
      expect(firstTrack.stop).toHaveBeenCalled();

      // A fresh context/graph was built for the new stream.
      expect(MockAudioContext.instances).toHaveLength(2);
      expect(device.currentStream).not.toBe(firstStream);
   });
});

// --- close ----------------------------------------------------------------

describe("close", () => {
   it("stops all tracks on the destination stream and the current stream", async () => {
      const device = new VoiceInputDevice(createMockClient());
      await device.getStream("device-1", 50, true);

      const ctx = MockAudioContext.instances[0];
      const destinationTrack = ctx.destinationStream.getTracks()[0];
      const inputTrack = device.currentStream!.getTracks()[0];

      device.close();

      expect(destinationTrack.stop).toHaveBeenCalled();
      expect(inputTrack.stop).toHaveBeenCalled();
   });

   it("closes the dummy input if one was created", async () => {
      const device = new VoiceInputDevice(createMockClient());
      await device.getStream("device-1", 50, true);
      await device.initializeAudioLevel();

      const closeSpy = vi.spyOn(device.dummyInput!, "close");

      device.close();

      expect(closeSpy).toHaveBeenCalledTimes(1);
   });

   it("does not throw when nothing has been initialized", () => {
      const device = new VoiceInputDevice(createMockClient());

      expect(() => device.close()).not.toThrow();
   });
});

// --- setGain ----------------------------------------------------------------

describe("setGain", () => {
   it("updates the gain node value as a 0-1 fraction of the percentage", async () => {
      const device = new VoiceInputDevice(createMockClient());
      await device.getStream("device-1", 50, true);

      device.setGain(75);

      const ctx = MockAudioContext.instances[0];
      expect(ctx.gainNode.gain.value).toBe(0.75);
   });

   it("does not throw when called before getStream", () => {
      const device = new VoiceInputDevice(createMockClient());

      expect(() => device.setGain(75)).not.toThrow();
   });

   it("propagates the new gain to the dummy input", async () => {
      const device = new VoiceInputDevice(createMockClient());
      await device.getStream("device-1", 50, true);
      await device.initializeAudioLevel();

      const dummySetGainSpy = vi.spyOn(device.dummyInput!, "setGain");

      device.setGain(20);

      expect(dummySetGainSpy).toHaveBeenCalledWith(20);
   });
});

// --- initializeAudioLevel: setup ---------------------------------------------

describe("initializeAudioLevel setup", () => {
   it("throws if getStream has not been called first", async () => {
      const device = new VoiceInputDevice(createMockClient());

      await expect(device.initializeAudioLevel()).rejects.toThrow();
   });

   it("creates a dummy VoiceInputDevice bound to the same client and requests a stream with the current options", async () => {
      const client = createMockClient();
      const device = new VoiceInputDevice(client);
      await device.getStream("device-1", 40, true);

      getUserMediaMock.mockClear();

      await device.initializeAudioLevel();

      expect(device.dummyInput).toBeInstanceOf(VoiceInputDevice);
      expect(getUserMediaMock).toHaveBeenCalledWith(
         expect.objectContaining({
            audio: expect.objectContaining({ deviceId: "device-1", echoCancellation: true, noiseSuppression: true }),
         }),
      );
   });

   it("reuses the same dummy input instance across repeated calls", async () => {
      const device = new VoiceInputDevice(createMockClient());
      await device.getStream("device-1", 40, true);

      await device.initializeAudioLevel();
      const dummy = device.dummyInput;

      await device.initializeAudioLevel();

      expect(device.dummyInput).toBe(dummy);
   });

   it("stops a previously running audio level checker on re-initialization", async () => {
      const stopSpy = vi.spyOn(AudioLevelChecker.prototype, "stopChecking");
      const device = new VoiceInputDevice(createMockClient());
      await device.getStream("device-1", 40, true);

      await device.initializeAudioLevel();
      expect(stopSpy).not.toHaveBeenCalled();

      await device.initializeAudioLevel();
      expect(stopSpy).toHaveBeenCalledTimes(1);
   });

   it("starts the audio level checker with the dummy input's stream", async () => {
      const startSpy = vi.spyOn(AudioLevelChecker.prototype, "startChecking");
      const device = new VoiceInputDevice(createMockClient());
      await device.getStream("device-1", 40, true);

      await device.initializeAudioLevel();

      const dummyCtx = MockAudioContext.instances[1]; // [0] is the main device, [1] is the dummy
      expect(startSpy).toHaveBeenCalledWith(dummyCtx.destination.stream);
   });
});

// --- initializeAudioLevel: VAD logic -----------------------------------------

/**
 * Helper to reach into the private `audioLevel` field and fire a reading,
 * exactly as the real AudioLevelChecker would via its onAudioLevel callback.
 */
function emitLevel(device: VoiceInputDevice, db: number) {
   const checker = (device as unknown as { audioLevel: AudioLevelChecker }).audioLevel;
   checker.onAudioLevel!(db);
}

async function setUpDevice(client: HuginnClient) {
   const device = new VoiceInputDevice(client);
   await device.getStream("device-1", 50, true);
   await device.initializeAudioLevel();
   return device;
}

// With inputThreshold mocked to -50: OPEN_DB = -50, CLOSE_DB = -60, HANGOVER_MS = 50.

describe("initializeAudioLevel VAD logic", () => {
   it("stays silent for levels between CLOSE_DB and OPEN_DB (hysteresis gap)", async () => {
      const client = createMockClient();
      const device = await setUpDevice(client);

      emitLevel(device, -55);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).not.toHaveBeenCalled();
      expect(voiceStore.getState().updateSpeakingState).not.toHaveBeenCalled();
   });

   it("starts speaking once the level reaches OPEN_DB", async () => {
      const client = createMockClient({ userId: "user-1" });
      const device = await setUpDevice(client);

      emitLevel(device, -40);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledWith({ isAudioPaused: false });
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledWith("user-1", true);
   });

   it("does not re-fire the speaking event on repeated readings above OPEN_DB", async () => {
      const client = createMockClient();
      const device = await setUpDevice(client);

      emitLevel(device, -40);
      emitLevel(device, -35);
      emitLevel(device, -30);

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledTimes(1);
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledTimes(1);
   });

   it("keeps speaking (and extends the hangover) while level stays at or above CLOSE_DB", async () => {
      const client = createMockClient();
      const device = await setUpDevice(client);

      currentTime = 0;
      emitLevel(device, -40); // starts speaking, hangoverUntil = 50

      currentTime = 40;
      emitLevel(device, -55); // still >= CLOSE_DB(-60), hangoverUntil becomes 90

      currentTime = 45;
      emitLevel(device, -65); // < CLOSE_DB, but now(45) is not > hangoverUntil(90)

      // Still only the initial "start speaking" calls - never stopped speaking.
      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledTimes(1);
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledTimes(1);
   });

   it("stops speaking once the level stays below CLOSE_DB past the hangover window", async () => {
      const client = createMockClient({ userId: "user-1" });
      const device = await setUpDevice(client);

      currentTime = 0;
      emitLevel(device, -40); // starts speaking, hangoverUntil = 50

      currentTime = 95; // past hangover
      emitLevel(device, -65); // below CLOSE_DB

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenLastCalledWith({ isAudioPaused: true });
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenLastCalledWith("user-1", false);
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledTimes(2);
   });

   it("immediately stops speaking when muted, even mid-hangover", async () => {
      const client = createMockClient({ userId: "user-1", isMuted: false });
      const device = await setUpDevice(client);

      currentTime = 0;
      emitLevel(device, -40); // starts speaking

      currentTime = 10; // well within the hangover window
      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = true;
      emitLevel(device, -40); // level is irrelevant while muting

      expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenLastCalledWith({ isAudioPaused: true });
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenLastCalledWith("user-1", false);
   });

   it("does not re-fire on repeated readings while still muted", async () => {
      const client = createMockClient({ isMuted: false });
      const device = await setUpDevice(client);

      emitLevel(device, -40); // starts speaking
      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = true;
      emitLevel(device, -40); // mute transition -> stop speaking

      const callsAfterMute = (voiceStore.getState().updateSpeakingState as ReturnType<typeof vi.fn>).mock.calls.length;

      emitLevel(device, -40); // still muted, no new transition

      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledTimes(callsAfterMute);
   });

   it("does not resume speaking on the unmute event itself", async () => {
      const client = createMockClient({ userId: "user-1" });
      const device = await setUpDevice(client);

      // Prime the internal "last mute state" with a real (quiet) reading first.
      emitLevel(device, -70);
      expect(voiceStore.getState().updateSpeakingState).not.toHaveBeenCalled();

      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = true;
      emitLevel(device, -70); // registers the mute transition (was already silent, so no call)

      client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted = false;
      emitLevel(device, -40); // this call only registers the unmute transition and returns, ignoring the loud level

      expect(voiceStore.getState().updateSpeakingState).not.toHaveBeenCalled();

      // A subsequent loud reading is required to actually start speaking.
      emitLevel(device, -40);
      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledWith("user-1", true);
   });

   it("defaults to an empty userId when the client has no current user", async () => {
      const client = createMockClient({ userId: null });
      const device = await setUpDevice(client);

      emitLevel(device, -40);

      expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledWith("", true);
   });
});
