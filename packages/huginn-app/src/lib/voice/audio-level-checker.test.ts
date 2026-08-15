import type { HMediaKind } from "@huginnjs/shared";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioLevelChecker } from "./audio-level-checker";

let lastAudioContext: MockAudioContext | undefined;
let lastWorkletNode: MockAudioWorkletNode | undefined;
let addModuleImpl: () => Promise<void> = () => Promise.resolve();

class MockAudioWorkletPort {
   public onmessage: ((event: MessageEvent<number>) => void) | null = null;
   public close = vi.fn();
}

class MockAudioWorkletNode {
   public port = new MockAudioWorkletPort();
   public connect = vi.fn((dest: unknown) => dest);
   public disconnect = vi.fn();
   public readonly context: unknown;
   public readonly name: string;

   public constructor(context: unknown, name: string) {
      this.context = context;
      this.name = name;
      lastWorkletNode = this;
   }
}

class MockMediaStreamAudioSourceNode {
   public connect = vi.fn((dest: unknown) => dest);
}

class MockAudioContext {
   public destination = { id: "destination" };
   public audioWorklet = {
      addModule: vi.fn(() => addModuleImpl()),
   };
   public close = vi.fn().mockResolvedValue(undefined);
   public createMediaStreamSource = vi.fn(() => new MockMediaStreamAudioSourceNode());

   public constructor() {
      lastAudioContext = this;
   }
}

// ---------------------------------------------------------------------

describe("AudioLevelChecker", () => {
   let stream: MediaStream;

   beforeEach(() => {
      lastAudioContext = undefined;
      lastWorkletNode = undefined;
      addModuleImpl = () => Promise.resolve();

      vi.stubGlobal("AudioContext", MockAudioContext);
      vi.stubGlobal("AudioWorkletNode", MockAudioWorkletNode);

      stream = {} as MediaStream;

      vi.clearAllMocks();
   });

   afterEach(() => {
      vi.unstubAllGlobals();
   });

   describe("constructor", () => {
      it("stores the ids and kind passed in", () => {
         const checker = new AudioLevelChecker("producer-1", "consumer-1", "user-1", "audio" as HMediaKind);

         expect(checker.producerId).toBe("producer-1");
         expect(checker.consumerId).toBe("consumer-1");
         expect(checker.userId).toBe("user-1");
         expect(checker.kind).toBe("audio");
      });

      it("starts in a stopped, zeroed-out state", () => {
         const checker = new AudioLevelChecker();

         expect(checker.isStopped).toBe(true);
         expect(checker.currentDb).toBe(0);
         expect(checker.onAudioLevel).toBeUndefined();
         expect(checker.audioContext).toBeUndefined();
         expect(checker.stream).toBeUndefined();
      });
   });

   describe("startChecking", () => {
      it("flips isStopped to false", async () => {
         const checker = new AudioLevelChecker();

         await checker.startChecking(stream);

         expect(checker.isStopped).toBe(false);
      });

      it("stores the stream and creates an AudioContext", async () => {
         const checker = new AudioLevelChecker();

         await checker.startChecking(stream);

         expect(checker.stream).toBe(stream);
         expect(checker.audioContext).toBeInstanceOf(MockAudioContext);
      });

      it("loads the volume-processor worklet module from a relative URL", async () => {
         const checker = new AudioLevelChecker();

         await checker.startChecking(stream);

         expect(lastAudioContext?.audioWorklet.addModule).toHaveBeenCalledTimes(1);
         const urlArg = (lastAudioContext!.audioWorklet.addModule.mock.calls[0] as unknown as [URL])[0];
         expect(urlArg).toBeInstanceOf(URL);
         expect(String(urlArg)).toContain("volume-processor.js");
      });

      it("creates a media stream source from the passed-in stream", async () => {
         const checker = new AudioLevelChecker();

         await checker.startChecking(stream);

         expect(lastAudioContext?.createMediaStreamSource).toHaveBeenCalledWith(stream);
      });

      it("creates a volume-processor AudioWorkletNode on the new context", async () => {
         const checker = new AudioLevelChecker();

         await checker.startChecking(stream);

         expect(lastWorkletNode?.name).toBe("volume-processor");
         expect(lastWorkletNode?.context).toBe(lastAudioContext);
      });

      it("wires source -> volumeNode -> destination", async () => {
         const checker = new AudioLevelChecker();

         await checker.startChecking(stream);

         const source = lastAudioContext?.createMediaStreamSource.mock.results[0]?.value;
         expect(source.connect).toHaveBeenCalledWith(lastWorkletNode);
         expect(lastWorkletNode?.connect).toHaveBeenCalledWith(lastAudioContext?.destination);
      });

      it("registers a message handler on the worklet node's port", async () => {
         const checker = new AudioLevelChecker();

         await checker.startChecking(stream);

         expect(typeof lastWorkletNode?.port.onmessage).toBe("function");
      });

      it("tears everything down instead of wiring up nodes if stopChecking runs while addModule is still pending", async () => {
         const checker = new AudioLevelChecker();
         let resolveAddModule!: () => void;
         addModuleImpl = () =>
            new Promise((resolve) => {
               resolveAddModule = resolve;
            });

         const startPromise = checker.startChecking(stream);
         await Promise.resolve(); // let startChecking reach the `await addModule(...)` line

         checker.stopChecking();
         resolveAddModule();
         await startPromise;

         expect(checker.isStopped).toBe(true);
         expect(checker.audioContext).toBeUndefined();
         expect(checker.stream).toBeUndefined();
         // Source/node creation happens after the isStopped check, so it should never run.
         expect(lastWorkletNode).toBeUndefined();
      });

      it("handles an addModule rejection caused by stopping while the module is loading", async () => {
         const checker = new AudioLevelChecker();
         let rejectAddModule!: (error: unknown) => void;
         addModuleImpl = () =>
            new Promise((_, reject) => {
               rejectAddModule = reject;
            });

         const startPromise = checker.startChecking(stream);
         await Promise.resolve();

         checker.stopChecking();
         rejectAddModule(new DOMException("Unable to load a worklet's module.", "AbortError"));

         await expect(startPromise).resolves.toBeUndefined();
         expect(checker.isStopped).toBe(true);
         expect(checker.audioContext).toBeUndefined();
         expect(lastWorkletNode).toBeUndefined();
      });

      it("still rejects when addModule fails while checking is active", async () => {
         const error = new Error("worklet failed to load");
         addModuleImpl = () => Promise.reject(error);
         const checker = new AudioLevelChecker();

         await expect(checker.startChecking(stream)).rejects.toBe(error);

         expect(checker.isStopped).toBe(true);
         expect(checker.audioContext).toBeUndefined();
         expect(lastWorkletNode).toBeUndefined();
      });
   });

   describe("message handling", () => {
      it("updates currentDb and forwards the value to onAudioLevel", async () => {
         const checker = new AudioLevelChecker();
         const onAudioLevel = vi.fn();
         checker.onAudioLevel = onAudioLevel;

         await checker.startChecking(stream);
         lastWorkletNode?.port.onmessage?.({ data: -18 } as MessageEvent<number>);

         expect(checker.currentDb).toBe(-18);
         expect(onAudioLevel).toHaveBeenCalledWith(-18);
      });

      it("ignores further messages once stopped", async () => {
         const checker = new AudioLevelChecker();
         const onAudioLevel = vi.fn();
         checker.onAudioLevel = onAudioLevel;

         await checker.startChecking(stream);
         const handler = lastWorkletNode?.port.onmessage;

         checker.stopChecking();
         handler?.({ data: -3 } as MessageEvent<number>);

         expect(checker.currentDb).toBe(0);
         expect(onAudioLevel).not.toHaveBeenCalled();
      });
   });

   describe("stopChecking", () => {
      it("marks isStopped true", async () => {
         const checker = new AudioLevelChecker();
         await checker.startChecking(stream);

         checker.stopChecking();

         expect(checker.isStopped).toBe(true);
      });

      it("tears down the worklet node and closes the audio context", async () => {
         const checker = new AudioLevelChecker();
         await checker.startChecking(stream);
         const node = lastWorkletNode!;
         const context = lastAudioContext!;

         checker.stopChecking();

         expect(node.port.onmessage).toBeNull();
         expect(node.port.close).toHaveBeenCalledTimes(1);
         expect(node.disconnect).toHaveBeenCalledTimes(1);
         expect(context.close).toHaveBeenCalledTimes(1);
      });

      it("clears audioContext, stream and onAudioLevel", async () => {
         const checker = new AudioLevelChecker();
         checker.onAudioLevel = vi.fn();
         await checker.startChecking(stream);

         checker.stopChecking();

         expect(checker.audioContext).toBeUndefined();
         expect(checker.stream).toBeUndefined();
         expect(checker.onAudioLevel).toBeUndefined();
      });

      it("is safe to call before startChecking has ever run", () => {
         const checker = new AudioLevelChecker();

         expect(() => checker.stopChecking()).not.toThrow();
         expect(checker.isStopped).toBe(true);
      });

      it("is safe to call repeatedly", async () => {
         const checker = new AudioLevelChecker();
         await checker.startChecking(stream);

         checker.stopChecking();

         expect(() => checker.stopChecking()).not.toThrow();
      });
   });
});
