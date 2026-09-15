import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import WaveformSlider from "./WaveformSlider";

describe("WaveformSlider", () => {
   it("renders waveform bytes as an accessible media slider", () => {
      const { container } = render(
         <WaveformSlider currentPercent={25} bufferedPercent={50} onChange={vi.fn()} waveform={btoa(String.fromCharCode(0, 127, 255))} />,
      );

      expect(container.querySelector('input[aria-label="Voice message playback position"]')).not.toBeNull();
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.querySelectorAll("g rect")).toHaveLength(3);
      expect(container.querySelectorAll("use")).toHaveLength(3);
   });

   it("falls back to the regular media slider without valid waveform data", () => {
      const { container } = render(<WaveformSlider currentPercent={25} bufferedPercent={50} onChange={vi.fn()} waveform="%%%" />);

      expect(container.querySelector("svg")).toBeNull();
   });
});
