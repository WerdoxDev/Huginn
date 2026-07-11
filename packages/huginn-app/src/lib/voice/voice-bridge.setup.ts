import { EventEmitter } from "@huginn/shared";
import { vi } from "vitest";

import type { AppSettings, StorageMap, VoicePreference } from "@/types";

class VoiceTransportManager extends EventEmitter<Record<string, unknown>> {
   getConsumers = vi.fn(() => [] as any[]);
   getProducer = vi.fn((_kind: string) => undefined as any);
   createConsumer = vi.fn(async (_userId: string, _kind: string) => {});
}

vi.doMock("@huginn/api", async () => {
   // class FakeEmitter {
   //    private listeners = new Map<string, Array<(...args: any[]) => any>>();

   //    on(event: string, cb: (...args: any[]) => any) {
   //       const arr = this.listeners.get(event) ?? [];
   //       arr.push(cb);
   //       this.listeners.set(event, arr);
   //       return this;
   //    }

   //    // Awaits every registered handler so tests can `await` the emit call
   //    // and know the (async) VoiceBridge handler has fully settled.
   //    async emit(event: string, ...args: any[]) {
   //       const cbs = this.listeners.get(event) ?? [];
   //       for (const cb of cbs) {
   //          await cb(...args);
   //       }
   //    }
   // }

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

// vi.mock("@stores/storageStore", () => {
//    const state = {
//       getCachedValue: vi.fn((key: string): StorageMap[keyof StorageMap] => {
//          if (key === "settings") {
//             return {
//                inputDeviceId: "default-input",
//                inputVolume: 80,
//                outputVolume: 90,
//                outputDeviceId: "default-output",
//                noiseSuppression: true,
//             } as AppSettings;
//          }
//          if (key === "voice-preferences") {
//             return [] as VoicePreference[];
//          }

//          return undefined as unknown as StorageMap[keyof StorageMap];
//       }),
//       setCachedValue: vi.fn(),
//       saveFromCachedValue: vi.fn(async (_key: string) => {}),
//    };
//    return {
//       storageStore: {
//          subscribe: vi.fn(),
//          getState: vi.fn(() => state),
//       },
//    };
// });

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

// console.log("SETUP", __dirname);
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
