import { EventEmitter } from "@huginn/shared";
import { vi } from "vitest";

class VoiceTransportManager extends EventEmitter<Record<string, unknown>> {
   getConsumers = vi.fn(() => [] as any[]);
   getProducer = vi.fn((_kind: string) => undefined as any);
   createConsumer = vi.fn(async (_userId: string, _kind: string) => {});
}

vi.doMock("@huginn/api", async () => {
   class FakeVoice extends EventEmitter<Record<string, unknown>> {
      public transport = new VoiceTransportManager();
      public device = {
         openMicrophone: vi.fn(async (_track: any) => {}),
         replaceMicrophoneTrack: vi.fn(async (_track: any) => {}),
      };
      public status = "idle";

      public constructor(
         public client: any,
         public options?: any,
      ) {
         super();
      }
   }

   return {
      Voice: FakeVoice,
      HuginnClient: class {},
   };
});

vi.doMock("./voice-transport-manager", async () => {
   return { VoiceTransportManager };
});

vi.mock("@stores/voiceStore", () => {
   const state = {
      updateSpeakingState: vi.fn(),
      removeSpeakingState: vi.fn(),
      clearSpeakingStates: vi.fn(),
   };
   return {
      voiceStore: {
         getState: vi.fn(() => state),
      },
   };
});

vi.mock("./audio-level-checker", () => {
   class AudioLevelChecker {
      public onAudioLevel?: (db: number) => void;
      public startChecking = vi.fn(async (_stream: any) => {});
      public stopChecking = vi.fn();

      public constructor(
         public producerId: string,
         public consumerId: string,
         public userId: string,
         public mediaKind: string,
      ) {}
   }
   return { AudioLevelChecker };
});

vi.mock("./audio-source-player", () => {
   class AudioSourcePlayer {
      public setGain = vi.fn((_output?: number, _individual?: number) => {});
      public setSinkId = vi.fn((_id: string) => {});
      public stop = vi.fn();

      public constructor(
         public stream: any,
         public producerId: string,
         public userId: string,
         public kind: string,
      ) {}
   }
   return { AudioSourcePlayer };
});

vi.mock("./voice-debugger", () => {
   class VoiceDebugger {
      public constructor(public client: any) {}
   }
   return { VoiceDebugger };
});

vi.mock("./voice-input-device", () => {
   class VoiceInputDevice {
      public getStream = vi.fn(async (_deviceId: string, _volume: number, _noiseSuppression: boolean) => {
         return { getAudioTracks: () => [{ id: "default-audio-track" }] };
      });
      public initializeAudioLevel = vi.fn(async () => {});
      public setGain = vi.fn((_volume: number) => {});
      public close = vi.fn();

      public constructor(public client: any) {}
   }
   return { VoiceInputDevice };
});
