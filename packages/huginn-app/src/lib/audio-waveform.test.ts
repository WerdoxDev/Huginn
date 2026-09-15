import { describe, expect, it } from "vitest";

import { decodeAudioWaveform, encodeAudioWaveform } from "./audio-waveform";

describe("audio waveform", () => {
   it("uses at most one datapoint per 100 milliseconds", () => {
      const waveform = encodeAudioWaveform([new Float32Array(48_000).fill(0.5)], 48_000);

      expect(decodeAudioWaveform(waveform)).toHaveLength(10);
   });

   it("caps long recordings at 256 datapoints", () => {
      const waveform = encodeAudioWaveform([new Float32Array(48_000 * 30).fill(0.5)], 48_000);

      expect(decodeAudioWaveform(waveform)).toHaveLength(256);
   });

   it("normalizes amplitudes into unsigned bytes", () => {
      const waveform = encodeAudioWaveform([Float32Array.from([0.25, 0.5])], 10);

      expect(Array.from(decodeAudioWaveform(waveform) ?? [])).toEqual([128, 255]);
   });

   it("returns zero-valued bytes for silence", () => {
      const waveform = encodeAudioWaveform([new Float32Array(200)], 1_000);

      expect(Array.from(decodeAudioWaveform(waveform) ?? [])).toEqual([0, 0]);
   });

   it("rejects malformed waveform data", () => {
      expect(decodeAudioWaveform("not base64")).toBeUndefined();
      expect(decodeAudioWaveform("")).toBeUndefined();
   });
});
