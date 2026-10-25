import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useElapsedTime } from "./useElapsedTime";

describe("useElapsedTime", () => {
   beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-25T12:00:00Z"));
   });

   afterEach(() => {
      cleanup();
      vi.useRealTimers();
   });

   it("shows zero when an updated activity starts after the last clock tick, then counts up", () => {
      const now = Date.now();
      const { result, rerender } = renderHook(({ startTime }) => useElapsedTime(startTime), {
         initialProps: { startTime: now - 60_000 },
      });

      expect(result.current.getFormattedDuration()).toBe("00:01:00");

      act(() => {
         vi.advanceTimersByTime(500);
      });
      rerender({ startTime: Date.now() });

      expect(result.current.getFormattedDuration()).toBe("00:00:00");

      act(() => {
         vi.advanceTimersByTime(1000);
      });

      expect(result.current.getFormattedDuration()).toBe("00:00:01");
   });

   it("preserves elapsed hours beyond one day and continues ticking", () => {
      const startTime = Date.now() - (25 * 3600 + 2 * 60 + 3) * 1000;
      const { result } = renderHook(() => useElapsedTime(startTime));

      expect(result.current.getFormattedDuration()).toBe("25:02:03");

      act(() => {
         vi.advanceTimersByTime(1000);
      });

      expect(result.current.getFormattedDuration()).toBe("25:02:04");
   });
});
