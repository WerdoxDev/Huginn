import type { HuginnClient } from "@huginnjs/api";
import type { Consumer, Producer, Transport } from "mediasoup-client/types";

import * as shared from "@huginnjs/shared";
import { NativeMediaDevices } from "@lib/capacitor/media-devices-plugin";
import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { windowStore } from "@stores/windowStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings, StorageMap } from "@/types";

import { AudioLevelChecker } from "./audio-level-checker";
import { AudioSourcePlayer } from "./audio-source-player";
import { VoiceBridge } from "./voice-bridge";
import { makeStream } from "./voice-bridge-test-utils";

vi.mock("@lib/capacitor/media-devices-plugin", () => ({
   NativeMediaDevices: {
      startCommunication: vi.fn(),
      stopCommunication: vi.fn(),
      setAudioRoute: vi.fn(),
   },
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeClient() {
   return {
      checkUser: vi.fn(),
      currentUser: { id: "self-user-id" },
      voiceManager: {
         voiceState: {
            gatewayVoiceState: { isAudioDeafened: false },
            updateLocalVoiceState: vi.fn(),
         },
      },
   };
}

function createConsumer(overrides: Partial<any> = {}) {
   return {
      id: "consumer-1",
      producerId: "producer-1",
      track: { id: "track-1" },
      kind: "audio",
      pause: vi.fn(),
      appData: { mediaKind: "microphone", userId: "user-1" },
      ...overrides,
   } as unknown as Consumer<shared.MediasoupAppData>;
}

function createProducer(overrides: Partial<any> = {}) {
   return {
      id: "producer-1",
      appData: { mediaKind: "microphone", userId: "user-1" },
      ...overrides,
   } as unknown as Producer<shared.MediasoupAppData>;
}

class FakeMediaStream {
   public tracks: any[];
   public constructor(tracks: any[] = []) {
      this.tracks = tracks;
   }
   public getAudioTracks() {
      return this.tracks;
   }
}

let client: HuginnClient;
let bridge: VoiceBridge;

beforeEach(() => {
   vi.clearAllMocks();
   vi.stubGlobal("MediaStream", FakeMediaStream);
   vi.stubGlobal("window", { electronAPI: undefined });
   windowStore.setState({ environment: "browser" });

   storageStore.getState().setCachedValue("settings", {
      ...storageStore.getState().getCachedValue("settings"),
      inputDeviceId: "default-input",
      inputVolume: 80,
      outputVolume: 90,
      outputDeviceId: "default-output",
      noiseSuppression: true,
   });

   vi.spyOn(storageStore.getState(), "setCachedValue").mockReset();
   vi.spyOn(storageStore.getState(), "getCachedValue");
   vi.spyOn(storageStore.getState(), "saveFromCachedValue");
   vi.spyOn(storageStore, "subscribe");

   client = makeClient() as unknown as HuginnClient;
   bridge = new VoiceBridge(client, {});
});

afterEach(() => {
   vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Constructor wiring
// ---------------------------------------------------------------------------

describe("constructor", () => {
   it("creates an input device and a debugger", () => {
      expect(bridge.inputDevice).toBeDefined();
      expect(bridge.debugger).toBeDefined();
   });

   it("starts with empty audio player / audio level collections", () => {
      expect(bridge.audioSourcePlayers).toHaveLength(0);
      expect(bridge.audioLevelCheckers.size).toBe(0);
   });

   // it("subscribes to the storage store for settings updates", () => {
   //    expect(storageStore.subscribe).toHaveBeenCalledTimes(1);
   //    const [selector] = vi.mocked(storageStore.subscribe).mock.calls[0];
   //    // The selector should pull `cache.settings` off whatever state it's given.
   //    expect(selector({ cache: { settings: {} } })).toBe("the-settings");
   // });

   // it("wires up transport listeners for producer/consumer lifecycle events", () => {
   //    // Emitting each of these should not throw, proving a handler is registered.
   //    expect(() => bridge.transport.emit("consumer_created", createConsumer({ appData: { mediaKind: "camera", userId: "u" } }))).not.toThrow();
   //    expect(() => bridge.transport.emit("producer_created", createProducer({ appData: { mediaKind: "camera" } }))).not.toThrow();
   // });
});

describe("getCurrentRoundTripTime", () => {
   function createStatsReport(stats: RTCStats[]): RTCStatsReport {
      return new Map(stats.map((stat) => [stat.id, stat])) as unknown as RTCStatsReport;
   }

   it("returns the slower selected transport RTT in milliseconds", async () => {
      const sendStats = createStatsReport([
         { id: "send-transport", type: "transport", selectedCandidatePairId: "send-pair" } as RTCTransportStats,
         { id: "send-pair", type: "candidate-pair", state: "succeeded", nominated: true, currentRoundTripTime: 0.025 } as RTCIceCandidatePairStats,
      ]);
      const recvStats = createStatsReport([
         { id: "recv-transport", type: "transport", selectedCandidatePairId: "recv-pair" } as RTCTransportStats,
         { id: "recv-pair", type: "candidate-pair", state: "succeeded", nominated: true, currentRoundTripTime: 0.04 } as RTCIceCandidatePairStats,
      ]);

      bridge.transport.sendTransport = { closed: false, getStats: vi.fn().mockResolvedValue(sendStats) } as unknown as Transport;
      bridge.transport.recvTransport = { closed: false, getStats: vi.fn().mockResolvedValue(recvStats) } as unknown as Transport;

      await expect(bridge.getCurrentRoundTripTime()).resolves.toBe(40);
   });

   it("returns undefined when no active transport has an RTT", async () => {
      bridge.transport.sendTransport = {
         closed: false,
         getStats: vi.fn().mockResolvedValue(createStatsReport([])),
      } as unknown as Transport;
      bridge.transport.recvTransport = {
         closed: false,
         getStats: vi.fn().mockRejectedValue(new Error("transport closed")),
      } as unknown as Transport;

      await expect(bridge.getCurrentRoundTripTime()).resolves.toBeUndefined();
   });
});

// ---------------------------------------------------------------------------
// "ready" -> handleReady -> openOrReplaceMicrophone
// ---------------------------------------------------------------------------

describe("ready event", () => {
   it("starts Android communication and applies the selected route before opening the microphone", async () => {
      windowStore.setState({ environment: "android" });
      vi.mocked(NativeMediaDevices.startCommunication).mockResolvedValue({
         routes: [],
         activeRouteId: "earpiece",
         selectedRouteId: "speaker",
         communicationStarted: true,
         supportsIndividualRoutes: true,
      });
      vi.mocked(NativeMediaDevices.setAudioRoute).mockResolvedValue({
         routes: [],
         activeRouteId: "speaker",
         selectedRouteId: "speaker",
         communicationStarted: true,
         supportsIndividualRoutes: true,
         accepted: true,
      });

      await bridge["handleReady"]();

      expect(NativeMediaDevices.startCommunication).toHaveBeenCalledTimes(1);
      expect(NativeMediaDevices.setAudioRoute).toHaveBeenCalledWith({ routeId: "speaker" });
      expect(bridge.inputDevice.getStream).toHaveBeenCalledWith("", 80, true);
      expect(vi.mocked(NativeMediaDevices.setAudioRoute).mock.invocationCallOrder[0]).toBeLessThan(
         vi.mocked(bridge.inputDevice.getStream).mock.invocationCallOrder[0],
      );
   });

   it("does not reapply an Android route that is already active", async () => {
      windowStore.setState({ environment: "android" });
      vi.mocked(NativeMediaDevices.startCommunication).mockResolvedValue({
         routes: [],
         activeRouteId: "speaker",
         selectedRouteId: "speaker",
         communicationStarted: true,
         supportsIndividualRoutes: true,
      });

      await bridge["handleReady"]();

      expect(NativeMediaDevices.setAudioRoute).not.toHaveBeenCalled();
   });

   it("opens the microphone using cached settings when no producer exists yet", async () => {
      vi.mocked(bridge.transport.getProducer).mockReturnValue(undefined);

      bridge.emit("ready", undefined);

      await vi.waitFor(() => {
         expect(bridge.inputDevice.getStream).toHaveBeenCalledWith("default-input", 80, true);
         expect(bridge.device.openMicrophone).toHaveBeenCalledWith({ id: "default-audio-track" });
         expect(bridge.device.replaceMicrophoneTrack).not.toHaveBeenCalled();
         expect(bridge.inputDevice.initializeAudioLevel).toHaveBeenCalledTimes(1);
      });
   });

   it("replaces the microphone track when a producer already exists", async () => {
      vi.mocked(bridge.transport.getProducer).mockReturnValue(createProducer({ id: "existing-producer" }));

      bridge.emit("ready", undefined);

      await vi.waitFor(() => {
         expect(bridge.device.replaceMicrophoneTrack).toHaveBeenCalledWith({ id: "default-audio-track" });
         expect(bridge.device.openMicrophone).not.toHaveBeenCalled();
      });
   });

   it("closes the input device and rethrows if opening/replacing the mic fails", async () => {
      vi.mocked(bridge.transport.getProducer).mockReturnValue(undefined);
      const failure = new Error("boom");
      vi.mocked(bridge.device.openMicrophone).mockRejectedValueOnce(failure);

      await expect(bridge["handleReady"]()).rejects.toThrow("boom");
      expect(bridge.inputDevice.close).toHaveBeenCalledTimes(1);
   });

   it("does not swallow errors thrown while fetching the input stream, and does not call close for that failure", async () => {
      const failure = new Error("no device");
      vi.mocked(bridge.inputDevice.getStream).mockRejectedValueOnce(failure);

      await expect(bridge["handleReady"]()).rejects.toThrow("no device");
      expect(bridge.inputDevice.close).not.toHaveBeenCalled();
   });
});

// ---------------------------------------------------------------------------
// "reset" -> handleReset
// ---------------------------------------------------------------------------

describe("reset event", () => {
   it("stops Android communication", async () => {
      windowStore.setState({ environment: "android" });
      vi.mocked(NativeMediaDevices.stopCommunication).mockResolvedValue({
         routes: [],
         activeRouteId: null,
         selectedRouteId: null,
         communicationStarted: false,
         supportsIndividualRoutes: true,
         accepted: true,
      });

      await bridge["handleReset"]();

      expect(NativeMediaDevices.stopCommunication).toHaveBeenCalledTimes(1);
   });

   it("tears down input device, speaking state, level checkers and audio players", async () => {
      const checker = new AudioLevelChecker("producer-1", "consumer-1", "user-1", "microphone");
      bridge.audioLevelCheckers.set("user-1", checker);

      const player = new AudioSourcePlayer(makeStream(), "producer-1", "user-1", "microphone");
      bridge.audioSourcePlayers.push(player);

      bridge.emit("reset", undefined);

      await vi.waitFor(() => {
         expect(bridge.inputDevice.close).toHaveBeenCalledTimes(1);
         expect(voiceStore.getState().clearSpeakingStates).toHaveBeenCalledTimes(1);
         expect(checker.stopChecking).toHaveBeenCalledTimes(1);
         expect(player.stop).toHaveBeenCalledTimes(1);
         expect(bridge.audioSourcePlayers).toHaveLength(0);
         expect(bridge.audioLevelCheckers.size).toBe(0);
      });
   });
});

// ---------------------------------------------------------------------------
// transport: consumer_created -> handleConsumerCreated
// ---------------------------------------------------------------------------

describe("consumer_created event", () => {
   it("creates and starts an audio level checker for microphone consumers", async () => {
      const consumer = createConsumer({ appData: { mediaKind: "microphone", userId: "user-1" } });

      bridge.transport.emit("consumer_created", consumer);

      await vi.waitFor(() => {
         const checker = bridge.audioLevelCheckers.get("user-1");
         expect(checker).toBeDefined();
         expect(checker!.startChecking).toHaveBeenCalledTimes(1);
      });
   });

   it("replaces an existing audio level checker for the same user", async () => {
      const oldChecker = new AudioLevelChecker("producer-1", "consumer-1", "user-1", "microphone");
      bridge.audioLevelCheckers.set("user-1", oldChecker);

      const consumer = createConsumer({ appData: { mediaKind: "microphone", userId: "user-1" } });
      bridge.transport.emit("consumer_created", consumer);

      await vi.waitFor(() => {
         expect(oldChecker.stopChecking).toHaveBeenCalledTimes(1);
         expect(bridge.audioLevelCheckers.get("user-1")).not.toBe(oldChecker);
      });
   });

   it("marks a user speaking once their audio level crosses the threshold", async () => {
      const consumer = createConsumer({ appData: { mediaKind: "microphone", userId: "user-1" } });
      bridge.transport.emit("consumer_created", consumer);

      await vi.waitFor(() => {
         const checker = bridge.audioLevelCheckers.get("user-1")!;

         // -90 is on the "speaking" side of the -95 dB threshold.
         checker.onAudioLevel!(-90);
         expect(voiceStore.getState().updateSpeakingState).toHaveBeenLastCalledWith("user-1", true);

         // -97 is on the "silent" side of the -95 dB threshold.
         checker.onAudioLevel!(-97);
         expect(voiceStore.getState().updateSpeakingState).toHaveBeenLastCalledWith("user-1", false);
      });
   });

   it("does not create an audio level checker for non-microphone consumers", async () => {
      const consumer = createConsumer({ appData: { mediaKind: "camera", userId: "user-2" } });
      bridge.transport.emit("consumer_created", consumer);

      expect(bridge.audioLevelCheckers.size).toBe(0);
   });

   it("pauses the consumer when locally deafened", async () => {
      client.voiceManager.voiceState.gatewayVoiceState.isAudioDeafened = true;
      const consumer = createConsumer();

      bridge.transport.emit("consumer_created", consumer);

      await vi.waitFor(() => expect(consumer.pause).toHaveBeenCalledTimes(1));
   });

   it("does not pause the consumer when not deafened", async () => {
      client.voiceManager.voiceState.gatewayVoiceState.isAudioDeafened = false;
      const consumer = createConsumer();

      bridge.transport.emit("consumer_created", consumer);

      await vi.waitFor(() => expect(consumer.pause).not.toHaveBeenCalled());
   });

   it("refreshes audio players, applying stored volume preferences", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "settings") return { outputVolume: 55 } as AppSettings;
         if (key === "voice-preferences") return [{ userId: "user-1", microphoneVolume: 42, streamVolume: 10 }];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });

      const consumers = [
         createConsumer({ appData: { mediaKind: "microphone", userId: "user-1" } }),
         createConsumer({ appData: { mediaKind: "stream_audio", userId: "user-1" } }),
      ];
      vi.mocked(bridge.transport.getConsumers).mockReturnValue(consumers);
      bridge.transport.emit("consumer_created", consumers[0]);
      bridge.transport.emit("consumer_created", consumers[1]);

      await vi.waitFor(() => {
         expect(bridge.audioSourcePlayers).toHaveLength(2);
         const micPlayer = bridge.audioSourcePlayers[0];
         expect(micPlayer.setGain).toHaveBeenCalledWith(55, undefined);
         expect(micPlayer.setGain).toHaveBeenCalledWith(undefined, 42);

         const streamPlayer = bridge.audioSourcePlayers[1];
         expect(streamPlayer.setGain).toHaveBeenCalledWith(55, undefined);
         expect(streamPlayer.setGain).toHaveBeenCalledWith(undefined, 10);
      });
   });

   it("should only create audio players for audio consumers", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "settings") return { outputVolume: 55 } as AppSettings;
         if (key === "voice-preferences") return [{ userId: "user-1", microphoneVolume: 42, streamVolume: 10 }];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });

      const consumers = [
         createConsumer({ kind: "audio", appData: { mediaKind: "microphone", userId: "user-1" } }),
         createConsumer({ kind: "audio", appData: { mediaKind: "stream_audio", userId: "user-1" } }),
         createConsumer({ kind: "video", appData: { mediaKind: "camera", userId: "user-1" } }),
      ];
      vi.mocked(bridge.transport.getConsumers).mockReturnValue(consumers);
      bridge.transport.emit("consumer_created", consumers[0]);
      bridge.transport.emit("consumer_created", consumers[1]);
      bridge.transport.emit("consumer_created", consumers[2]);

      await vi.waitFor(() => {
         expect(bridge.audioSourcePlayers).toHaveLength(2);
      });
   });

   it("stops old audio players when refreshing", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "settings") return { outputVolume: 55 } as AppSettings;
         if (key === "voice-preferences") return [{ userId: "user-1", microphoneVolume: 42, streamVolume: 10 }];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });
      const oldPlayer = new AudioSourcePlayer(makeStream(), "p1", "user-1", "microphone");
      bridge.audioSourcePlayers.push(oldPlayer);

      vi.mocked(bridge.transport.getConsumers).mockReturnValue([createConsumer({ appData: { mediaKind: "microphone", userId: "user-1" } })]);

      bridge.transport.emit("consumer_created", createConsumer({ appData: { mediaKind: "microphone", userId: "user-1" } }));
      await vi.waitFor(() => {
         expect(oldPlayer.stop).toHaveBeenCalledTimes(1);
         expect(bridge.audioSourcePlayers).toHaveLength(1);
      });
   });

   it("skips video consumers and consumers without a track when refreshing audio players", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "settings") return { outputVolume: 55 } as AppSettings;
         if (key === "voice-preferences") return [{ userId: "user-1", microphoneVolume: 42, streamVolume: 10 }];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });
      vi.mocked(bridge.transport.getConsumers).mockReturnValue([
         createConsumer({ kind: "video", appData: { mediaKind: "camera", userId: "user-1" } }),
         createConsumer({ track: undefined, appData: { mediaKind: "microphone", userId: "user-1" } }),
      ]);

      bridge.transport.emit("consumer_created", createConsumer({ appData: { mediaKind: "camera", userId: "user-1" } }));

      await vi.waitFor(() => expect(bridge.audioSourcePlayers).toHaveLength(0));
   });

   it("throws if a consumer belongs to a user with no stored voice preference", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "settings") return { outputVolume: 55 } as AppSettings;
         if (key === "voice-preferences") return [];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });
      const consumer = createConsumer({ appData: { mediaKind: "microphone", userId: "unknown-user" } });
      vi.mocked(bridge.transport.getConsumers).mockReturnValue([consumer]);

      await expect(bridge["handleConsumerCreated"](consumer)).rejects.toThrow("Voice preference for unknown-user was not found");
   });
});

// ---------------------------------------------------------------------------
// transport: remote_producer_created -> handleRemoteProducerCreated
// ---------------------------------------------------------------------------

describe("remote_producer_created event", () => {
   it("creates a consumer for camera producers", async () => {
      bridge.transport.emit("remote_producer_created", { kind: "camera", userId: "user-1", producerId: "producer-1" });
      await vi.waitFor(() => expect(bridge.transport.createConsumer).toHaveBeenCalledWith("user-1", "camera"));
   });

   it("creates a consumer for microphone producers and seeds a default voice preference", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "voice-preferences") return [];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });

      bridge.transport.emit("remote_producer_created", { kind: "microphone", userId: "user-1", producerId: "producer-1" });

      await vi.waitFor(() => {
         expect(bridge.transport.createConsumer).toHaveBeenCalledWith("user-1", "microphone");
         expect(storageStore.getState().setCachedValue).toHaveBeenCalledWith(
            "voice-preferences",
            expect.arrayContaining([expect.objectContaining({ userId: "user-1", microphoneVolume: 100, streamVolume: 100 })]),
         );
         expect(storageStore.getState().saveFromCachedValue).toHaveBeenCalledWith("voice-preferences");
      });
   });

   it("does not overwrite an existing voice preference", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "voice-preferences") return [{ userId: "user-1", microphoneVolume: 5, streamVolume: 5 }];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });

      bridge.transport.emit("remote_producer_created", { kind: "microphone", userId: "user-1", producerId: "producer-1" });

      await vi.waitFor(() => {
         expect(storageStore.getState().setCachedValue).not.toHaveBeenCalled();
         expect(storageStore.getState().saveFromCachedValue).not.toHaveBeenCalled();
      });
   });

   it("does not create a consumer for a bare stream_audio producer with no matching video stream", async () => {
      vi.mocked(bridge.transport.getConsumers).mockReturnValue([]);

      bridge.transport.emit("remote_producer_created", { kind: "stream_audio", userId: "user-1", producerId: "producer-1" });

      await vi.waitFor(() => expect(bridge.transport.createConsumer).not.toHaveBeenCalled());
   });

   it("creates a stream_audio consumer once a matching stream_video consumer exists", async () => {
      vi.mocked(storageStore.getState().getCachedValue).mockImplementation((key: string): StorageMap[keyof StorageMap] => {
         if (key === "voice-preferences") return [];
         return undefined as unknown as StorageMap[keyof StorageMap];
      });
      vi.mocked(bridge.transport.getConsumers).mockReturnValue([createConsumer({ appData: { mediaKind: "stream_video", userId: "user-1" } })]);

      bridge.transport.emit("remote_producer_created", { kind: "stream_audio", userId: "user-1", producerId: "producer-1" });

      await vi.waitFor(() => expect(bridge.transport.createConsumer).toHaveBeenCalledWith("user-1", "stream_audio"));
   });
});

// ---------------------------------------------------------------------------
// transport: producer_closed / remote_producer_closed -> handleAnyProducerClosed
// ---------------------------------------------------------------------------

describe("producer closed events", () => {
   it("stops and removes the audio level checker for a closed microphone producer", async () => {
      const checker = new AudioLevelChecker("producer-1", "consumer-1", "user-1", "microphone");
      bridge.audioLevelCheckers.set("user-1", checker);

      bridge.transport.emit("producer_closed", { kind: "microphone", userId: "user-1", producerId: "p1" });

      await vi.waitFor(() => {
         expect(checker.stopChecking).toHaveBeenCalledTimes(1);
         expect(bridge.audioLevelCheckers.has("user-1")).toBe(false);
         expect(voiceStore.getState().removeSpeakingState).toHaveBeenCalledWith("user-1");
      });
   });

   it("does not throw when the microphone checker no longer exists", async () => {
      await expect(bridge["handleAnyProducerClosed"]({ kind: "microphone", userId: "ghost", producerId: "p1" })).resolves.not.toThrow();
      expect(voiceStore.getState().removeSpeakingState).toHaveBeenCalledWith("ghost");
   });

   it("stops the audio loopback when the current user's stream_audio producer closes", async () => {
      vi.stubGlobal("window", { electronAPI: { stopAudioLoopback: vi.fn(async () => {}) } });

      bridge.transport.emit("remote_producer_closed", {
         kind: "stream_audio",
         userId: client.currentUser!.id,
         producerId: "p1",
      });

      await vi.waitFor(() => expect(window.electronAPI.stopAudioLoopback).toHaveBeenCalledTimes(1));
   });

   it("does not stop the audio loopback for another user's stream_audio producer", async () => {
      vi.stubGlobal("window", { electronAPI: { stopAudioLoopback: vi.fn(async () => {}) } });

      bridge.transport.emit("remote_producer_closed", { kind: "stream_audio", userId: "someone-else", producerId: "p1" });

      await vi.waitFor(() => expect(window.electronAPI.stopAudioLoopback).not.toHaveBeenCalled());
   });

   it("stops and removes the matching audio source player", async () => {
      const matching = new AudioSourcePlayer(makeStream(), "p1", "user-1", "camera");
      const other = new AudioSourcePlayer(makeStream(), "p2", "user-1", "camera");
      bridge.audioSourcePlayers.push(matching, other);

      bridge.transport.emit("producer_closed", { kind: "camera", userId: "user-1", producerId: "p1" });

      await vi.waitFor(() => {
         expect(matching.stop).toHaveBeenCalledTimes(1);
         expect(bridge.audioSourcePlayers).toEqual([other]);
      });
   });

   it("leaves audio source players untouched when no producerId matches", async () => {
      const player = new AudioSourcePlayer(makeStream(), "p1", "user-1", "camera");
      bridge.audioSourcePlayers.push(player);

      bridge.transport.emit("producer_closed", { kind: "camera", userId: "user-1", producerId: "does-not-match" });

      await vi.waitFor(() => {
         expect(player.stop).not.toHaveBeenCalled();
         expect(bridge.audioSourcePlayers).toEqual([player]);
      });
   });
});

// ---------------------------------------------------------------------------
// transport: producer_created -> handleProducerCreated
// ---------------------------------------------------------------------------

describe("producer_created event", () => {
   it("always reports the user as active via checkUser", async () => {
      bridge.transport.emit("producer_created", createProducer({ appData: { mediaKind: "camera" } }));
      await vi.waitFor(() => expect(client.checkUser).toHaveBeenCalledTimes(1));
   });

   it("pauses local audio and clears speaking state when a microphone producer opens", async () => {
      bridge.transport.emit("producer_created", createProducer({ appData: { mediaKind: "microphone" } }));

      await vi.waitFor(() => {
         expect(client.voiceManager.voiceState.updateLocalVoiceState).toHaveBeenCalledWith({ isAudioPaused: true });
         expect(voiceStore.getState().updateSpeakingState).toHaveBeenCalledWith(client.currentUser!.id, false);
      });
   });

   it("does not touch local voice state for non-microphone producers", async () => {
      bridge.transport.emit("producer_created", createProducer({ appData: { mediaKind: "camera" } }));

      await vi.waitFor(() => {
         expect(client.voiceManager.voiceState.updateLocalVoiceState).not.toHaveBeenCalled();
         expect(voiceStore.getState().updateSpeakingState).not.toHaveBeenCalled();
      });
   });
});

// ---------------------------------------------------------------------------
// storage subscription -> handleStorageUpdated
// ---------------------------------------------------------------------------

describe("storage settings updates", () => {
   beforeEach(() => {
      vi.spyOn(shared, "diff");
   });

   function getStorageListener() {
      // Second argument passed to storageStore.subscribe(selector, listener)
      return vi.mocked(storageStore.subscribe).mock.calls[0][1] as (current: any, previous: any) => void;
   }

   it("ignores updates while the bridge is not ready", () => {
      (bridge.status as any) = "idle";
      const listener = getStorageListener();

      listener({ outputVolume: 10 }, { outputVolume: 5 });

      expect(shared.diff).not.toHaveBeenCalled();
   });

   it("applies output volume changes to every audio player once ready", async () => {
      (bridge.status as any) = "ready";

      vi.mocked(shared.diff).mockReturnValue({ outputVolume: 33 });
      const player = new AudioSourcePlayer(makeStream(), "p1", "user-1", "microphone");
      bridge.audioSourcePlayers.push(player);

      getStorageListener()({ outputVolume: 33 }, { outputVolume: 5 });

      expect(player.setGain).toHaveBeenCalledWith(33, undefined);
   });

   it("updates the input device gain when inputVolume changes", () => {
      (bridge.status as any) = "ready";
      vi.mocked(shared.diff).mockReturnValue({ inputVolume: 60 });

      getStorageListener()({ inputVolume: 60 }, { inputVolume: 10 });

      expect(bridge.inputDevice.setGain).toHaveBeenCalledWith(60);
   });

   it("reopens the microphone when the input device or noise suppression changes", () => {
      (bridge.status as any) = "ready";
      vi.mocked(shared.diff).mockReturnValue({ inputDeviceId: "new-device" });
      const current = { inputDeviceId: "new-device", inputVolume: 70, noiseSuppression: false };

      getStorageListener()(current, { inputDeviceId: "old-device", inputVolume: 70, noiseSuppression: false });

      expect(bridge.inputDevice.getStream).toHaveBeenCalledWith("new-device", 70, false);
   });

   it("updates the sink id on every audio player when the output device changes", () => {
      (bridge.status as any) = "ready";
      vi.mocked(shared.diff).mockReturnValue({ outputDeviceId: "new-output" });
      const player = new AudioSourcePlayer(makeStream(), "p1", "user-1", "microphone");
      bridge.audioSourcePlayers.push(player);

      getStorageListener()({ outputDeviceId: "new-output" }, { outputDeviceId: "old-output" });

      expect(player.setSinkId).toHaveBeenCalledWith("new-output");
   });

   it("does nothing extra when diff reports no relevant changes", () => {
      (bridge.status as any) = "ready";
      vi.mocked(shared.diff).mockReturnValue({});

      const player = new AudioSourcePlayer(makeStream(), "p1", "user-1", "microphone");
      bridge.audioSourcePlayers.push(player);

      getStorageListener()({}, {});

      expect(player.setGain).not.toHaveBeenCalled();
      expect(player.setSinkId).not.toHaveBeenCalled();
      expect(bridge.inputDevice.setGain).not.toHaveBeenCalled();
   });
});

// ---------------------------------------------------------------------------
// updateVoicePreference
// ---------------------------------------------------------------------------

describe("updateVoicePreference", () => {
   it("updates an existing preference and applies the new gain to a live player", () => {
      vi.mocked(storageStore.getState().getCachedValue).mockReturnValue([{ userId: "user-1", microphoneVolume: 50, streamVolume: 50 }]);
      const micPlayer = new AudioSourcePlayer(makeStream(), "p1", "user-1", "microphone");
      bridge.audioSourcePlayers.push(micPlayer);

      bridge.updateVoicePreference("user-1", { microphoneVolume: 77 });

      expect(storageStore.getState().setCachedValue).toHaveBeenCalledWith(
         "voice-preferences",
         expect.arrayContaining([expect.objectContaining({ userId: "user-1", microphoneVolume: 77, streamVolume: 50 })]),
      );
      expect(micPlayer.setGain).toHaveBeenCalledWith(undefined, 77);
   });

   it("creates a new preference when both volumes are supplied", () => {
      vi.mocked(storageStore.getState().getCachedValue).mockReturnValue([]);

      bridge.updateVoicePreference("new-user", { microphoneVolume: 60, streamVolume: 70 });

      expect(storageStore.getState().setCachedValue).toHaveBeenCalledWith(
         "voice-preferences",
         expect.arrayContaining([{ userId: "new-user", microphoneVolume: 60, streamVolume: 70 }]),
      );
   });

   it("throws when creating a new preference without both volumes", () => {
      vi.mocked(storageStore.getState().getCachedValue).mockReturnValue([]);

      expect(() => bridge.updateVoicePreference("new-user", { microphoneVolume: 60 })).toThrow(/requires both microphone and screen share volumes/);
   });

   it("updates the matching stream audio player, not the microphone player", () => {
      vi.mocked(storageStore.getState().getCachedValue).mockReturnValue([{ userId: "user-1", microphoneVolume: 50, streamVolume: 50 }]);
      const streamPlayer = new AudioSourcePlayer(makeStream(), "p1", "user-1", "stream_audio");
      bridge.audioSourcePlayers.push(streamPlayer);

      bridge.updateVoicePreference("user-1", { streamVolume: 15 });

      expect(streamPlayer.setGain).toHaveBeenCalledWith(undefined, 15);
   });

   it("does not error when there is no live player for the user", () => {
      vi.mocked(storageStore.getState().getCachedValue).mockReturnValue([{ userId: "user-1", microphoneVolume: 50, streamVolume: 50 }]);

      expect(() => bridge.updateVoicePreference("user-1", { microphoneVolume: 20 })).not.toThrow();
   });
});

// ---------------------------------------------------------------------------
// startAudioLoopback / stopAudioLoopback
// ---------------------------------------------------------------------------

describe("audio loopback", () => {
   it("does nothing when electronAPI is unavailable", async () => {
      const track = await bridge.startAudioLoopback("Some App");
      expect(track).toBeUndefined();
   });

   it("throws when the native loopback fails to start", async () => {
      vi.stubGlobal("window", {
         electronAPI: {
            startAudioLoopback: vi.fn(async () => false),
         },
      });

      await expect(bridge.startAudioLoopback("Some App", "123")).rejects.toThrow(/Process audio loopback/);
   });

   it("sets up a track generator and returns a track when the native loopback starts", async () => {
      class FakeGenerator {
         public writable = { getWriter: () => ({ write: vi.fn(async () => {}) }) };
         public constructor(public opts: any) {}
      }
      vi.stubGlobal("MediaStreamTrackGenerator", FakeGenerator);
      vi.stubGlobal(
         "AudioData",
         class {
            public constructor(opts: any) {
               Object.assign(this, opts);
            }
         },
      );

      let capturedCallback: ((_: unknown, data: Uint8Array) => Promise<void>) | undefined;
      vi.stubGlobal("window", {
         electronAPI: {
            startAudioLoopback: vi.fn(async () => true),
            onLoopbackData: vi.fn((cb: any) => {
               capturedCallback = cb;
               return vi.fn();
            }),
         },
      });

      const track = await bridge.startAudioLoopback("Some App", "123");

      expect(track).toBeDefined();
      expect(capturedCallback).toBeDefined();
   });

   it("does nothing when stopping without electronAPI available", async () => {
      await expect(bridge.stopAudioLoopback()).resolves.toBeUndefined();
   });

   it("stops the native loopback and clears the data listener when electronAPI is available", async () => {
      const stopAudioLoopback = vi.fn(async () => {});
      vi.stubGlobal("window", { electronAPI: { stopAudioLoopback } });

      await bridge.stopAudioLoopback();

      expect(stopAudioLoopback).toHaveBeenCalledTimes(1);
   });
});
