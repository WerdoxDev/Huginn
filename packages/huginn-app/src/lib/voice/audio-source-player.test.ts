import type { HMediaKind, Snowflake } from "@huginnjs/shared";

import { log } from "@huginnjs/shared";
import { storageStore } from "@stores/storageStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/types";

import { AudioSourcePlayer } from "./audio-source-player";

// ---------------------------------------------------------------------
// Web Audio API mocks.
// ---------------------------------------------------------------------

let lastAudioContext: MockAudioContext | undefined;

class MockGainNode {
   public gain = { value: 0 };
   public connect = vi.fn();
   public disconnect = vi.fn();
}

class MockMediaStreamAudioSourceNode {
   public connect = vi.fn();
}

class MockAudioContext {
   public readonly options: { sinkId?: string };
   public destination = { id: "destination" };
   public state: "running" | "suspended" | "closed" = "running";
   public createGain = vi.fn(() => new MockGainNode());
   public createMediaStreamSource = vi.fn((_stream: MediaStream) => new MockMediaStreamAudioSourceNode());
   public setSinkId = vi.fn();
   public resume = vi.fn();
   public close = vi.fn();

   public constructor(options: { sinkId?: string } = {}) {
      this.options = options;
      // oxlint-disable-next-line typescript/no-this-alias
      lastAudioContext = this;
   }
}

// ---------------------------------------------------------------------
// <audio> element mock.
// ---------------------------------------------------------------------

class MockAudioElement {
   public autoplay = false;
   public srcObject: MediaStream | null = null;
   public pause = vi.fn();
   public addEventListener = vi.fn();
}

let lastAudioElement: MockAudioElement | undefined;
let createElementMock: ReturnType<typeof vi.fn>;

function getLoadedMetadataRegistration() {
   const call = lastAudioElement?.addEventListener.mock.calls.find((args: any[]) => args[0] === "loadedmetadata");
   return {
      handler: call?.[1] as (e: Event) => void,
      signal: call?.[2]?.signal as AbortSignal,
   };
}

// ---------------------------------------------------------------------

describe("AudioSourcePlayer", () => {
   let stream: MediaStream;

   function createPlayer(overrides: Partial<{ producerId: string; userId: Snowflake; kind: HMediaKind }> = {}) {
      return new AudioSourcePlayer(
         stream,
         overrides.producerId ?? "producer-1",
         overrides.userId ?? ("user-1" as Snowflake),
         overrides.kind ?? ("audio" as HMediaKind),
      );
   }

   beforeEach(() => {
      vi.clearAllMocks();

      lastAudioContext = undefined;
      lastAudioElement = undefined;

      vi.stubGlobal("AudioContext", MockAudioContext);

      createElementMock = vi.fn(() => {
         lastAudioElement = new MockAudioElement();
         return lastAudioElement;
      });
      vi.stubGlobal("document", { createElement: createElementMock });

      // getCachedValue = vi.fn(() => ({ outputDeviceId: "device-abc" }));
      storageStore.getState().setCachedValue("settings", { outputDeviceId: "device-abc" } as AppSettings);

      vi.spyOn(storageStore.getState(), "getCachedValue").mockReset();
      vi.spyOn(storageStore, "getState").mockReset();

      stream = {} as MediaStream;
   });

   afterEach(() => {
      vi.unstubAllGlobals();
   });

   describe("constructor", () => {
      it("stores the stream and identifying fields", () => {
         const player = createPlayer({ producerId: "prod-9", userId: "user-9" as Snowflake, kind: "video" as HMediaKind });

         expect(player.stream).toBe(stream);
         expect(player.producerId).toBe("prod-9");
         expect(player.userId).toBe("user-9");
         expect(player.kind).toBe("video");
      });

      it("defaults globalGain and localGain to 1", () => {
         const player = createPlayer();

         expect(player.globalGain).toBe(1);
         expect(player.localGain).toBe(1);
      });

      it("creates a paused <audio> element bound to the stream", () => {
         createPlayer();

         expect(createElementMock).toHaveBeenCalledWith("audio");
         expect(lastAudioElement?.autoplay).toBe(false);
         expect(lastAudioElement?.srcObject).toBe(stream);
      });

      it("builds the AudioContext using the cached output device id", () => {
         createPlayer();

         expect(storageStore.getState).toHaveBeenCalledTimes(1);
         expect(storageStore.getState().getCachedValue).toHaveBeenCalledWith("settings");
         expect(lastAudioContext?.options.sinkId).toBe("device-abc");
      });

      it("exposes the created audio context and a gain node from it", () => {
         const player = createPlayer();

         expect(player.audioContext).toBe(lastAudioContext);
         expect(lastAudioContext?.createGain).toHaveBeenCalledTimes(1);
         expect(player.gainNode).toBeInstanceOf(MockGainNode);
      });

      it("registers a loadedmetadata listener guarded by an abort signal", () => {
         createPlayer();

         expect(lastAudioElement?.addEventListener).toHaveBeenCalledWith("loadedmetadata", expect.any(Function), { signal: expect.any(AbortSignal) });
      });
   });

   describe("loadedmetadata handling", () => {
      it("wires the media stream source into the gain node and destination, then stops listening", () => {
         const player = createPlayer();
         const { handler, signal } = getLoadedMetadataRegistration();

         handler(new Event("loadedmetadata"));

         expect(lastAudioContext?.createMediaStreamSource).toHaveBeenCalledWith(stream);
         const source = lastAudioContext?.createMediaStreamSource.mock.results[0]?.value;
         expect(source.connect).toHaveBeenCalledWith(player.gainNode);
         expect(player.gainNode.connect).toHaveBeenCalledWith(lastAudioContext?.destination);
         expect(signal.aborted).toBe(true);
      });

      it("does nothing if srcObject was cleared before metadata loaded", () => {
         createPlayer();
         const { handler, signal } = getLoadedMetadataRegistration();

         lastAudioElement!.srcObject = null;
         handler(new Event("loadedmetadata"));

         expect(lastAudioContext?.createMediaStreamSource).not.toHaveBeenCalled();
         expect(signal.aborted).toBe(false);
      });
   });

   describe("stop", () => {
      it("tears down the gain node, context, and audio element", () => {
         const player = createPlayer();

         player.stop();

         expect(player.gainNode.disconnect).toHaveBeenCalledTimes(1);
         expect(lastAudioContext?.close).toHaveBeenCalledTimes(1);
         expect(lastAudioElement?.pause).toHaveBeenCalledTimes(1);
         expect(lastAudioElement?.srcObject).toBeNull();
      });

      it("aborts the loadedmetadata listener if it hasn't fired yet", () => {
         const player = createPlayer();
         const { signal } = getLoadedMetadataRegistration();

         player.stop();

         expect(signal.aborted).toBe(true);
      });
   });

   describe("setGain", () => {
      it("updates globalGain from a percent and recomputes gainNode.gain.value", () => {
         const player = createPlayer();

         player.setGain(80, undefined);

         const expectedGlobal = (80 / 100) ** 2.3219;
         expect(player.globalGain).toBeCloseTo(expectedGlobal);
         expect(player.localGain).toBe(1);
         expect(player.gainNode.gain.value).toBeCloseTo(expectedGlobal * 1);
      });

      it("updates localGain from a percent and recomputes gainNode.gain.value", () => {
         const player = createPlayer();

         player.setGain(undefined, 50);

         const expectedLocal = (50 / 100) ** 2.3219;
         expect(player.localGain).toBeCloseTo(expectedLocal);
         expect(player.globalGain).toBe(1);
         expect(player.gainNode.gain.value).toBeCloseTo(1 * expectedLocal);
      });

      it("combines both gains when both percents are provided", () => {
         const player = createPlayer();

         player.setGain(50, 50);

         const expected = (50 / 100) ** 2.3219 * (50 / 100) ** 2.3219;
         expect(player.gainNode.gain.value).toBeCloseTo(expected);
      });

      it("leaves prior gains untouched and reapplies them when called with undefined", () => {
         const player = createPlayer();
         player.setGain(80, 60);
         const before = player.gainNode.gain.value;

         player.setGain(undefined, undefined);

         expect(player.globalGain).toBeCloseTo((80 / 100) ** 2.3219);
         expect(player.localGain).toBeCloseTo((60 / 100) ** 2.3219);
         expect(player.gainNode.gain.value).toBeCloseTo(before);
      });
   });

   describe("setSinkId", () => {
      it("forwards the device id to the audio context", () => {
         const player = createPlayer();

         player.setSinkId("device-xyz");

         expect(lastAudioContext?.setSinkId).toHaveBeenCalledWith("device-xyz");
      });

      it("resumes the context if it was suspended", () => {
         const player = createPlayer();
         lastAudioContext!.state = "suspended";

         player.setSinkId("device-xyz");

         expect(lastAudioContext?.resume).toHaveBeenCalledTimes(1);
      });

      it("does not resume the context if it is already running", () => {
         const player = createPlayer();
         lastAudioContext!.state = "running";

         player.setSinkId("device-xyz");

         expect(lastAudioContext?.resume).not.toHaveBeenCalled();
      });
   });
});
