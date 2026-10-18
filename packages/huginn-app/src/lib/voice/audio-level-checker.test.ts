import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioLevelChecker } from "./audio-level-checker";

class LevelContext {
   static instances: LevelContext[] = [];
   destination = {};
   audioWorklet = { addModule: vi.fn(async () => {}) };
   createMediaStreamSource = () => ({ connect: (node: LevelWorklet) => node });
   close = vi.fn();

   constructor() {
      LevelContext.instances.push(this);
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

const stream = {} as MediaStream;

beforeEach(() => {
   LevelContext.instances = [];
   LevelWorklet.instances = [];
   vi.stubGlobal("AudioContext", LevelContext);
   vi.stubGlobal("AudioWorkletNode", LevelWorklet);
});

afterEach(() => {
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

describe("audio level reporting", () => {
   it("reports measured levels and stops reporting after cleanup", async () => {
      const checker = new AudioLevelChecker();
      const onLevel = vi.fn();
      checker.onAudioLevel = onLevel;
      await checker.startChecking(stream);
      const worklet = LevelWorklet.instances[0];

      worklet.emit(-18);
      expect(onLevel).toHaveBeenLastCalledWith(-18);
      expect(checker.currentDb).toBe(-18);

      checker.stopChecking();
      onLevel.mockClear();
      worklet.emit(-3);
      expect(onLevel).not.toHaveBeenCalled();
      expect(LevelContext.instances[0].close).toHaveBeenCalled();
      expect(worklet.port.close).toHaveBeenCalled();
   });

   it.each(["resolve", "reject"] as const)("can stop while the worklet is loading (%s)", async (settlement) => {
      const loading = Promise.withResolvers<void>();
      // The browser can reject addModule when closing its AudioContext.
      class LoadingContext extends LevelContext {
         constructor() {
            super();
            this.audioWorklet.addModule.mockReturnValue(loading.promise);
         }
      }
      vi.stubGlobal("AudioContext", LoadingContext);
      const checker = new AudioLevelChecker();
      const onLevel = vi.fn();
      checker.onAudioLevel = onLevel;
      const starting = checker.startChecking(stream);

      checker.stopChecking();
      if (settlement === "resolve") loading.resolve();
      else loading.reject(new DOMException("Loading cancelled", "AbortError"));

      await expect(starting).resolves.toBeUndefined();
      expect(checker.isStopped).toBe(true);
      expect(LevelContext.instances[0].close).toHaveBeenCalled();
      expect(onLevel).not.toHaveBeenCalled();
      expect(LevelWorklet.instances).toHaveLength(0);
   });

   it("reports loading failures and releases the audio context", async () => {
      const failure = new Error("worklet unavailable");
      class FailingContext extends LevelContext {
         constructor() {
            super();
            this.audioWorklet.addModule.mockRejectedValue(failure);
         }
      }
      vi.stubGlobal("AudioContext", FailingContext);
      const checker = new AudioLevelChecker();

      await expect(checker.startChecking(stream)).rejects.toBe(failure);
      expect(checker.isStopped).toBe(true);
      expect(LevelContext.instances[0].close).toHaveBeenCalled();
   });

   it("restarts reporting from the new stream without retaining the previous worklet", async () => {
      const checker = new AudioLevelChecker();
      const onLevel = vi.fn();
      checker.onAudioLevel = onLevel;
      await checker.startChecking(stream);
      const previous = LevelWorklet.instances[0];

      await checker.startChecking({} as MediaStream);
      previous.emit(-10);
      LevelWorklet.instances[1].emit(-30);

      expect(onLevel.mock.calls).toEqual([[-30]]);
      expect(LevelContext.instances[0].close).toHaveBeenCalled();
      checker.stopChecking();
   });
});
