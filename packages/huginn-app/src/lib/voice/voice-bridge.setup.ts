import { EventEmitter } from "@huginnjs/shared";
import { vi } from "vitest";

// Keep the real stores and event delivery; replace browser/native boundaries.
vi.mock("@lib/sync-zustand", () => ({ syncZustandStore: vi.fn() }));
vi.mock("@lib/query-utils", () => ({ getChannels: () => [], getChannelComputedName: () => "Call" }));

vi.doMock("@huginnjs/api", () => ({
   Voice: class extends EventEmitter<Record<string, unknown>> {
      transport = Object.assign(new EventEmitter<Record<string, unknown>>(), {
         getConsumers: vi.fn(() => []),
         getProducer: vi.fn(),
         createConsumer: vi.fn(async () => {}),
      });
      device = {
         openMicrophone: vi.fn(async () => {}),
         replaceMicrophoneTrack: vi.fn(async () => {}),
      };
      status = "idle";
      constructor(public client: unknown) {
         super();
         this.on("ready", () => {
            this.status = "ready";
         });
         this.on("reset", () => {
            this.status = "idle";
         });
      }
   },
   HuginnClient: class {},
}));

vi.mock("@capawesome-team/capacitor-android-foreground-service", () => ({
   ForegroundService: {
      startForegroundService: vi.fn(async () => {}),
      stopForegroundService: vi.fn(async () => {}),
      addListener: vi.fn(async () => ({ remove: vi.fn() })),
   },
   ServiceType: { Microphone: "microphone" },
}));
vi.mock("@lib/capacitor/media-devices-plugin", () => ({
   NativeMediaDevices: {
      startCommunication: vi.fn(),
      stopCommunication: vi.fn(),
      setAudioRoute: vi.fn(),
   },
}));
vi.mock("./audio-level-checker", () => ({
   AudioLevelChecker: class {
      onAudioLevel?: (db: number) => void;
      startChecking = vi.fn(async () => {});
      stopChecking = vi.fn();
   },
}));
vi.mock("./audio-source-player", () => ({
   AudioSourcePlayer: class {
      setGain = vi.fn();
      setSinkId = vi.fn();
      stop = vi.fn();
      constructor(
         public stream: MediaStream,
         public producerId: string,
         public userId: string,
         public kind: string,
      ) {}
   },
}));
vi.mock("./voice-debugger", () => ({ VoiceDebugger: class {} }));
vi.mock("./voice-host", () => ({ VoiceHost: class {} }));
vi.mock("./voice-popout", () => ({ VoicePopout: class {} }));
vi.mock("./voice-input-device", () => ({
   VoiceInputDevice: class {
      static acquire = vi.fn(() => () => this.close());
      static getStream = vi.fn(async () => {
         const track = { id: "microphone-track", clone: () => track };
         return { getAudioTracks: () => [track] };
      });
      static initializeAudioLevel = vi.fn(async () => {});
      static setGain = vi.fn();
      static close = vi.fn();
   },
}));
