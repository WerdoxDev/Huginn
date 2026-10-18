import { storageStore } from "@stores/storageStore";
import { windowStore } from "@stores/windowStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioSourcePlayer } from "./audio-source-player";

class PlaybackContext {
   static instances: PlaybackContext[] = [];
   gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
   source = { connect: vi.fn() };
   destination = {};
   state = "running";
   createGain = () => this.gain;
   createMediaStreamSource = vi.fn(() => this.source);
   setSinkId = vi.fn();
   resume = vi.fn();
   close = vi.fn();

   constructor(public options: AudioContextOptions) {
      PlaybackContext.instances.push(this);
   }
}

let audio: HTMLAudioElement;
let stream: MediaStream;

beforeEach(() => {
   PlaybackContext.instances = [];
   vi.stubGlobal("AudioContext", PlaybackContext);
   audio = document.createElement("audio");
   vi.spyOn(audio, "pause").mockImplementation(() => {});
   vi.spyOn(document, "createElement").mockImplementation((() => audio) as unknown as typeof document.createElement);
   stream = {} as MediaStream;
   windowStore.setState({ environment: "browser" });
   const settings = storageStore.getState().getCachedValue("settings");
   storageStore.getState().setCachedValue("settings", { ...settings, outputDeviceId: "speakers" });
});

afterEach(() => {
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

function play() {
   const player = new AudioSourcePlayer(stream, "producer", "user", "microphone");
   audio.dispatchEvent(new Event("loadedmetadata"));
   return { player, context: PlaybackContext.instances[0] };
}

describe("audio playback", () => {
   it("routes the received stream to the selected speakers when media is ready", () => {
      const { context } = play();

      expect(context.options).toEqual({ sinkId: "speakers" });
      expect(context.createMediaStreamSource).toHaveBeenCalledWith(stream);
      expect(context.source.connect).toHaveBeenCalledWith(context.gain);
      expect(context.gain.connect).toHaveBeenCalledWith(context.destination);
   });

   it("uses Android's communication route instead of a desktop output device", () => {
      windowStore.setState({ environment: "android" });
      const { context } = play();

      expect(context.options).toEqual({});
   });

   it("combines output and participant volumes and preserves the other volume when one changes", () => {
      const { player, context } = play();
      player.setGain(100, 100);
      expect(context.gain.gain.value).toBe(1);

      player.setGain(50, undefined);
      const outputGain = context.gain.gain.value;
      expect(outputGain).toBeGreaterThan(0);
      expect(outputGain).toBeLessThan(1);

      player.setGain(undefined, 50);
      expect(context.gain.gain.value).toBeGreaterThan(0);
      expect(context.gain.gain.value).toBeLessThan(outputGain);

      player.setGain(undefined, 100);
      expect(context.gain.gain.value).toBe(outputGain);
      player.setGain(0, undefined);
      expect(context.gain.gain.value).toBe(0);
   });

   it("switches speakers and resumes suspended playback", () => {
      const { player, context } = play();
      context.state = "suspended";

      player.setSinkId("headphones");

      expect(context.setSinkId).toHaveBeenCalledWith("headphones");
      expect(context.resume).toHaveBeenCalled();
   });

   it("releases playback and prevents late metadata from restarting it", () => {
      const player = new AudioSourcePlayer(stream, "producer", "user", "microphone");
      const context = PlaybackContext.instances[0];

      player.stop();
      audio.dispatchEvent(new Event("loadedmetadata"));

      expect(audio.srcObject).toBeNull();
      expect(context.close).toHaveBeenCalled();
      expect(context.gain.disconnect).toHaveBeenCalled();
      expect(context.createMediaStreamSource).not.toHaveBeenCalled();
   });
});
