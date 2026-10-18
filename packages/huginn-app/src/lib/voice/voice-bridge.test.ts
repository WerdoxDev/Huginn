import type { HuginnClient } from "@huginnjs/api";
import type { HMediaKind, MediasoupAppData, UserSettings, VoicePreference } from "@huginnjs/shared";
import type { Consumer, Transport } from "mediasoup-client/types";

import { NativeMediaDevices } from "@lib/capacitor/media-devices-plugin";
import { clientStore } from "@stores/clientStoreState";
import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { windowStore } from "@stores/windowStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { storageDefaults } from "../../../shared/storage-defaults";
import { VoiceBridge } from "./voice-bridge";

const mediabunnyMocks = vi.hoisted(() => ({
   inputs: [] as Array<{ disposed: boolean; release?: () => void }>,
}));

vi.mock("mediabunny", () => {
   class Input {
      public disposed = false;
      public release?: () => void;

      public constructor(_options: unknown) {
         mediabunnyMocks.inputs.push(this);
      }

      public async getVideoTracks() {
         return [{ input: this, getFirstTimestamp: async () => 0 }];
      }

      public dispose() {
         this.disposed = true;
         this.release?.();
      }
   }

   class VideoSampleSink {
      private readonly input: Input;

      public constructor(track: { input: Input }, _options: unknown) {
         this.input = track.input;
      }

      public async *samples() {
         yield {
            close: vi.fn(),
            toVideoFrame: () => ({ close: vi.fn() }),
         };
         await new Promise<void>((resolve) => {
            this.input.release = resolve;
         });
      }
   }

   return {
      Input,
      MPEG_TS: Symbol("MPEG_TS"),
      ReadableStreamSource: class {
         public constructor(_stream: ReadableStream) {}
      },
      VideoSampleSink,
   };
});

function makeClient() {
   return {
      currentUser: { id: "self" },
      checkUser: vi.fn(),
      users: { editSettings: vi.fn(async () => {}) },
      voiceManager: {
         applyVoiceState: vi.fn(async () => {}),
         voiceState: {
            gatewayVoiceState: { isAudioDeafened: false },
            updateLocalVoiceState: vi.fn(),
            updateVoicePreferences: vi.fn(),
         },
      },
   };
}

function preference(userId = "user-1", microphoneVolume = 50, streamVolume = 60): VoicePreference {
   return { userId, microphoneVolume, streamVolume, isMicrophoneMuted: false, isStreamMuted: false };
}

function consumer(kind: HMediaKind = "microphone", userId = "user-1") {
   return {
      id: `consumer-${userId}-${kind}`,
      producerId: `producer-${userId}-${kind}`,
      track: { id: `track-${userId}-${kind}` },
      kind: kind === "camera" || kind === "stream_video" ? "video" : "audio",
      pause: vi.fn(),
      appData: { mediaKind: kind, userId },
   } as unknown as Consumer<MediasoupAppData>;
}

class FakeMediaStream {
   constructor(public tracks: MediaStreamTrack[] = []) {}
   getAudioTracks() {
      return this.tracks.filter((track) => track.kind !== "video");
   }
   getTracks() {
      return this.tracks;
   }
}

let client: ReturnType<typeof makeClient>;
let bridge: VoiceBridge;

beforeEach(() => {
   vi.clearAllMocks();
   mediabunnyMocks.inputs.length = 0;
   vi.stubGlobal("MediaStream", FakeMediaStream);
   windowStore.setState({ environment: "browser", platform: "win32" });
   storageStore.getState().setCachedValue("settings", {
      ...storageDefaults.settings,
      inputDeviceId: "microphone",
      inputVolume: 80,
      outputVolume: 90,
      outputDeviceId: "speakers",
   });
   clientStore.setState({ userSettings: { voicePreferences: [preference()] } as UserSettings });
   voiceStore.getState().clearSpeakingStates();
   // Dispose each bridge's window-lifetime subscriptions after its scenario.
   vi.spyOn(storageStore, "subscribe");
   vi.spyOn(clientStore, "subscribe");
   client = makeClient();
   bridge = new VoiceBridge(client as unknown as HuginnClient);
   vi.mocked(bridge.transport.getProducer).mockReturnValue(undefined);
   vi.mocked(bridge.transport.getConsumers).mockReturnValue([]);
});

afterEach(() => {
   bridge.emit("reset", undefined);
   for (const result of [...vi.mocked(storageStore.subscribe).mock.results, ...vi.mocked(clientStore.subscribe).mock.results]) {
      if (result.type === "return") result.value();
   }
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

async function receive(incoming = consumer()) {
   vi.mocked(bridge.transport.getConsumers).mockReturnValue([incoming]);
   bridge.transport.emit("consumer_created", incoming);
   await vi.waitFor(() => expect(bridge.audioSourcePlayers).toHaveLength(incoming.kind === "video" ? 0 : 1));
   return incoming;
}

describe("call audio", () => {
   it("opens the configured microphone on joining and releases it on leaving", async () => {
      bridge.emit("ready", undefined);
      await vi.waitFor(() => expect(bridge.device.openMicrophone).toHaveBeenCalledWith(expect.objectContaining({ id: "microphone-track" })));
      expect(bridge.inputDevice.getStream).toHaveBeenCalledWith("microphone", 80, true);

      bridge.emit("reset", undefined);
      expect(bridge.inputDevice.close).toHaveBeenCalled();
   });

   it("replaces an active microphone when the selected device changes", async () => {
      bridge.emit("ready", undefined);
      await vi.waitFor(() => expect(bridge.inputDevice.initializeAudioLevel).toHaveBeenCalled());
      vi.mocked(bridge.transport.getProducer).mockReturnValue({ id: "existing" } as ReturnType<typeof bridge.transport.getProducer>);
      const settings = storageStore.getState().getCachedValue("settings");

      storageStore.getState().setCachedValue("settings", { ...settings, inputDeviceId: "headset" });

      await vi.waitFor(() => expect(bridge.device.replaceMicrophoneTrack).toHaveBeenCalled());
      expect(bridge.inputDevice.getStream).toHaveBeenCalledWith("headset", 80, true);
   });

   it("applies output volume and participant preferences to received audio", async () => {
      await receive();
      const player = bridge.audioSourcePlayers[0];

      expect(player.setGain).toHaveBeenCalledWith(90, undefined);
      expect(player.setGain).toHaveBeenCalledWith(undefined, 50);

      clientStore.getState().setUserSettings({ voicePreferences: [preference("user-1", 25, 60)] });
      expect(player.setGain).toHaveBeenLastCalledWith(undefined, 25);
   });

   it("applies new output settings to live playback", async () => {
      bridge.emit("ready", undefined);
      await vi.waitFor(() => expect(bridge.inputDevice.initializeAudioLevel).toHaveBeenCalled());
      await receive();
      const player = bridge.audioSourcePlayers[0];
      const settings = storageStore.getState().getCachedValue("settings");

      storageStore.getState().setCachedValue("settings", { ...settings, outputVolume: 35, outputDeviceId: "headphones" });

      expect(player.setGain).toHaveBeenCalledWith(35, undefined);
      expect(player.setSinkId).toHaveBeenCalledWith("headphones");
   });

   it("updates the visible speaking state and removes it when the producer leaves", async () => {
      const incoming = await receive();
      const level = bridge.audioLevelCheckers.get("user-1")!;

      level.onAudioLevel?.(-30);
      expect(voiceStore.getState().speakingStates).toContainEqual({ userId: "user-1", speaking: true });
      level.onAudioLevel?.(-99);
      expect(voiceStore.getState().speakingStates).toContainEqual({ userId: "user-1", speaking: false });

      bridge.transport.emit("remote_producer_closed", { kind: "microphone", userId: "user-1", producerId: incoming.producerId });
      expect(voiceStore.getState().speakingStates).toEqual([]);
      expect(bridge.audioSourcePlayers).toEqual([]);
   });

   it("keeps new incoming audio paused while deafened", async () => {
      client.voiceManager.voiceState.gatewayVoiceState.isAudioDeafened = true;
      const incoming = await receive();

      expect(incoming.pause).toHaveBeenCalled();
   });

   it("stops received audio and clears speaking indicators when the call resets", async () => {
      await receive();
      const player = bridge.audioSourcePlayers[0];
      const checker = bridge.audioLevelCheckers.get("user-1")!;
      checker.onAudioLevel?.(-20);

      bridge.emit("reset", undefined);

      expect(player.stop).toHaveBeenCalled();
      expect(checker.stopChecking).toHaveBeenCalled();
      expect(voiceStore.getState().speakingStates).toEqual([]);
      expect(bridge.audioSourcePlayers).toEqual([]);
   });

   it("updates relay policy for the next connection when settings change", () => {
      const settings = storageStore.getState().getCachedValue("settings");
      storageStore.getState().setCachedValue("settings", { ...settings, forceRelay: true });
      expect(bridge.transport.iceTransportPolicy).toBe("relay");
      storageStore.getState().setCachedValue("settings", { ...settings, forceRelay: false });
      expect(bridge.transport.iceTransportPolicy).toBe("all");
   });
});

describe("remote media", () => {
   it.each(["camera", "microphone"] as const)("automatically subscribes to a remote %s", async (kind) => {
      bridge.transport.emit("remote_producer_created", { kind, userId: "user-1", producerId: "remote" });

      await vi.waitFor(() => expect(client.voiceManager.applyVoiceState).toHaveBeenCalled());
      expect(bridge.transport.createConsumer).toHaveBeenCalledWith("user-1", kind);
      expect(clientStore.getState().userSettings?.voicePreferences).toEqual([preference()]);
   });

   it("saves default preferences for a new participant without losing existing preferences", async () => {
      bridge.transport.emit("remote_producer_created", { kind: "microphone", userId: "new-user", producerId: "remote" });

      await vi.waitFor(() => expect(client.voiceManager.applyVoiceState).toHaveBeenCalled());
      const preferences = [preference(), preference("new-user", 100, 100)];
      expect(clientStore.getState().userSettings?.voicePreferences).toEqual(preferences);
      expect(client.users.editSettings).toHaveBeenCalledWith({ voicePreferences: preferences });
   });

   it.each([false, true])("subscribes to stream audio only while watching its video: %s", async (watching) => {
      vi.mocked(bridge.transport.getConsumers).mockReturnValue(watching ? [consumer("stream_video")] : []);
      bridge.transport.emit("remote_producer_created", { kind: "stream_audio", userId: "user-1", producerId: "remote" });

      await vi.waitFor(() => expect(client.voiceManager.applyVoiceState).toHaveBeenCalled());
      if (watching) expect(bridge.transport.createConsumer).toHaveBeenCalledWith("user-1", "stream_audio");
      else expect(bridge.transport.createConsumer).not.toHaveBeenCalled();
   });
});

describe("Android calls", () => {
   it("uses the selected communication route and releases it on leaving", async () => {
      windowStore.setState({ environment: "android" });
      vi.mocked(NativeMediaDevices.startCommunication).mockResolvedValue({
         routes: [],
         activeRouteId: "earpiece",
         selectedRouteId: "speaker",
         communicationStarted: true,
         supportsIndividualRoutes: true,
      });
      bridge.emit("ready", undefined);

      await vi.waitFor(() => expect(bridge.device.openMicrophone).toHaveBeenCalled());
      expect(NativeMediaDevices.setAudioRoute).toHaveBeenCalledWith({ routeId: "speaker" });
      expect(bridge.inputDevice.getStream).toHaveBeenCalledWith("", 80, true);

      bridge.emit("reset", undefined);
      await vi.waitFor(() => expect(NativeMediaDevices.stopCommunication).toHaveBeenCalled());
   });
});

describe("connection latency", () => {
   it("reports the slower selected transport RTT in milliseconds", async () => {
      function transport(rtt: number) {
         return {
            closed: false,
            getStats: async () =>
               new Map([
                  ["transport", { type: "transport", selectedCandidatePairId: "pair" }],
                  ["pair", { type: "candidate-pair", id: "pair", currentRoundTripTime: rtt }],
               ]),
         } as unknown as Transport;
      }
      bridge.transport.sendTransport = transport(0.025);
      bridge.transport.recvTransport = transport(0.04);

      await expect(bridge.getCurrentRoundTripTime()).resolves.toBe(40);
   });

   it("returns no latency when transports are unavailable", async () => {
      bridge.transport.recvTransport = { closed: false, getStats: vi.fn().mockRejectedValue(new Error("closed")) } as unknown as Transport;

      await expect(bridge.getCurrentRoundTripTime()).resolves.toBeUndefined();
   });
});

describe("Linux desktop capture", () => {
   it("restarts the native recorder without replacing the generated stream", async () => {
      class FakeGenerator extends EventTarget {
         public contentHint = "";
         public kind = "video";
         public readyState: MediaStreamTrackState = "live";
         public writable = {
            getWriter: () => ({
               abort: vi.fn(async () => {}),
               write: vi.fn(async () => {}),
            }),
         };

         public stop() {
            this.readyState = "ended";
            this.dispatchEvent(new Event("ended"));
         }
      }

      const startDesktopCapture = vi.fn();
      vi.stubGlobal("MediaStreamTrackGenerator", FakeGenerator);
      vi.stubGlobal("electronAPI", {
         startDesktopCapture,
         stopDesktopCapture: vi.fn(),
         stopAudioLoopback: vi.fn(async () => {}),
         desktopCaptureChunkConsumed: vi.fn(),
         onDesktopCaptureChunk: vi.fn(() => vi.fn()),
         onDesktopCaptureError: vi.fn(() => vi.fn()),
         onDesktopCaptureStopped: vi.fn(() => vi.fn()),
      });
      windowStore.setState({ platform: "linux" });

      const firstStream = await bridge.startDesktopCapture(1920, 1080, 30);
      const secondStream = await bridge.startDesktopCapture(1280, 720, 60);

      expect(secondStream).toBe(firstStream);
      expect(startDesktopCapture).toHaveBeenCalledTimes(2);
      expect(startDesktopCapture).toHaveBeenNthCalledWith(1, expect.objectContaining({ width: 1920, height: 1080, frameRate: 30 }));
      expect(startDesktopCapture).toHaveBeenNthCalledWith(2, expect.objectContaining({ width: 1280, height: 720, frameRate: 60 }));
      expect(startDesktopCapture.mock.calls[0][0].captureId).not.toBe(startDesktopCapture.mock.calls[1][0].captureId);
      expect(mediabunnyMocks.inputs).toHaveLength(2);
      expect(mediabunnyMocks.inputs[0].disposed).toBe(true);
      expect(mediabunnyMocks.inputs[1].disposed).toBe(false);
      expect(bridge.getDesktopCaptureOptions()).toEqual({ width: 1280, height: 720, frameRate: 60 });
      await bridge.updateDesktopCapture({ frameRate: 45 });
      expect(startDesktopCapture).toHaveBeenLastCalledWith(expect.objectContaining({ width: 1280, height: 720, frameRate: 45 }));
      expect(firstStream.getTracks()[0].readyState).toBe("live");
      firstStream.getTracks()[0].stop();
   });

   it("stores requested capture options for non-Linux screen sharing", async () => {
      const capturedStream = new FakeMediaStream();
      vi.stubGlobal("navigator", {
         mediaDevices: { getDisplayMedia: vi.fn(async () => capturedStream) },
      });
      windowStore.setState({ platform: "win32" });

      await expect(bridge.startDesktopCapture(2560, 1440, 60)).resolves.toBe(capturedStream);

      expect(bridge.getDesktopCaptureOptions()).toEqual({ width: 2560, height: 1440, frameRate: 60 });
   });
});

describe("application audio loopback", () => {
   it("converts native audio into a playable track and releases its listener on stop", async () => {
      const write = vi.fn(async (_data: unknown) => {});
      class AudioGenerator {
         kind = "audio";
         writable = { getWriter: () => ({ write }) };
      }
      vi.stubGlobal("MediaStreamTrackGenerator", AudioGenerator);
      vi.stubGlobal(
         "AudioData",
         class {
            constructor(options: unknown) {
               Object.assign(this, options);
            }
         },
      );
      const unlisten = vi.fn();
      const onLoopbackData = vi.fn((_callback: (_event: unknown, bytes: Uint8Array) => Promise<void>) => unlisten);
      const startAudioLoopback = vi.fn();
      const stopAudioLoopback = vi.fn(async () => {});
      vi.stubGlobal("electronAPI", { startAudioLoopback, stopAudioLoopback, onLoopbackData });

      const track = await bridge.startAudioLoopback("application", 123);
      const pcm = new Uint8Array([0, 64, 0, 192]);
      await onLoopbackData.mock.calls[0][0](undefined, pcm);

      expect(track?.kind).toBe("audio");
      expect(startAudioLoopback).toHaveBeenCalledWith("application", 123);
      expect(write).toHaveBeenCalledWith(expect.objectContaining({ data: new Float32Array([0.5, -0.5]), numberOfFrames: 1 }));

      await bridge.stopAudioLoopback();
      expect(stopAudioLoopback).toHaveBeenCalled();
      expect(unlisten).toHaveBeenCalled();
   });
});
