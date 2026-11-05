import { describe, expect, it } from "vitest";

import { getVoiceGridLayout } from "./voice-grid-layout";

describe("voice grid layout", () => {
   it("fits a small call within the available space", () => {
      const { elementWidth, elementHeight } = getVoiceGridLayout(2, 800, 300);

      expect(elementWidth * 2 + 12).toBeLessThanOrEqual(800);
      expect(elementHeight).toBeLessThanOrEqual(300);
      expect(elementHeight).toBeGreaterThanOrEqual(144);
      expect(elementWidth / elementHeight).toBeCloseTo(16 / 9, 1);
   });

   it("uses multiple rows when the panel is tall enough", () => {
      const { elementWidth, elementHeight } = getVoiceGridLayout(6, 800, 600);

      expect(elementWidth * 2 + 12).toBeLessThanOrEqual(800);
      expect(elementHeight * 3 + 24).toBeLessThanOrEqual(600);
      expect(elementWidth).toBeGreaterThan(256);
   });

   it("keeps crowded tiles readable and within the panel width", () => {
      const { elementWidth, elementHeight } = getVoiceGridLayout(30, 600, 146);

      expect(elementHeight).toBeGreaterThanOrEqual(144);
      expect(elementHeight).toBeLessThanOrEqual(146);
      expect(elementWidth).toBeGreaterThanOrEqual(256);
      expect(elementWidth * 2 + 12).toBeLessThanOrEqual(600);
      expect(elementHeight * 15 + 14 * 12).toBeGreaterThan(146);
   });

   it("supports panels narrower than the preferred tile width", () => {
      const { elementWidth, elementHeight } = getVoiceGridLayout(10, 180, 300);

      expect(elementWidth).toBe(180);
      expect(elementHeight).toBeGreaterThanOrEqual(144);
   });

   it.each([
      [0, 800, 300],
      [10, 0, 300],
      [10, 800, 0],
      [10, -20, -30],
   ])("handles empty and hidden panels (%i, %i, %i)", (count, width, height) => {
      expect(getVoiceGridLayout(count, width, height)).toEqual({ elementWidth: 0, elementHeight: 0 });
   });
});
