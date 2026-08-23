import type { TouchEvent } from "react";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSwipeToReply } from "./useSwipeToReply";

function touchEvent(x: number, y: number, identifier = 1) {
   return {
      touches: [{ clientX: x, clientY: y, identifier }],
   } as unknown as TouchEvent<HTMLDivElement>;
}

describe("useSwipeToReply", () => {
   beforeEach(() => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1_000 });
   });

   it("does not reply to a tap", () => {
      const onReply = vi.fn();
      const { result } = renderHook(() => useSwipeToReply(onReply));

      act(() => {
         result.current.touchHandlers.onTouchStart(touchEvent(500, 100));
         result.current.touchHandlers.onTouchEnd(touchEvent(500, 100));
      });

      expect(onReply).not.toHaveBeenCalled();
   });

   it("does not reply after vertical scrolling", () => {
      const onReply = vi.fn();
      const { result } = renderHook(() => useSwipeToReply(onReply));

      act(() => {
         result.current.touchHandlers.onTouchStart(touchEvent(500, 100));
         result.current.touchHandlers.onTouchMove(touchEvent(495, 120));
         result.current.touchHandlers.onTouchEnd(touchEvent(495, 120));
      });

      expect(onReply).not.toHaveBeenCalled();
      expect(result.current.swipeX).toBe(0);
   });

   it("replies after a left swipe crosses the viewport threshold", () => {
      const onReply = vi.fn();
      const { result } = renderHook(() => useSwipeToReply(onReply));

      act(() => {
         result.current.touchHandlers.onTouchStart(touchEvent(500, 100));
         result.current.touchHandlers.onTouchMove(touchEvent(299, 100));
         result.current.touchHandlers.onTouchEnd(touchEvent(299, 100));
      });

      expect(onReply).toHaveBeenCalledOnce();
      expect(result.current.swipeX).toBe(0);
      expect(result.current.isReplyReady).toBe(false);
   });

   it("uses the latest gesture position even when touch end occurs before a render", () => {
      const onReply = vi.fn();
      const { result } = renderHook(() => useSwipeToReply(onReply));

      act(() => {
         result.current.touchHandlers.onTouchStart(touchEvent(300, 100));
         result.current.touchHandlers.onTouchMove(touchEvent(99, 100));
         result.current.touchHandlers.onTouchEnd(touchEvent(99, 100));
      });

      expect(onReply).toHaveBeenCalledOnce();
   });

   it("does not reply if the swipe returns below the threshold", () => {
      const onReply = vi.fn();
      const { result } = renderHook(() => useSwipeToReply(onReply));

      act(() => {
         result.current.touchHandlers.onTouchStart(touchEvent(500, 100));
         result.current.touchHandlers.onTouchMove(touchEvent(299, 100));
         result.current.touchHandlers.onTouchMove(touchEvent(350, 100));
         result.current.touchHandlers.onTouchEnd(touchEvent(350, 100));
      });

      expect(onReply).not.toHaveBeenCalled();
   });

   it("resets without replying when the gesture is cancelled", () => {
      const onReply = vi.fn();
      const { result } = renderHook(() => useSwipeToReply(onReply));

      act(() => {
         result.current.touchHandlers.onTouchStart(touchEvent(500, 100));
         result.current.touchHandlers.onTouchMove(touchEvent(299, 100));
         result.current.touchHandlers.onTouchCancel(touchEvent(299, 100));
      });

      expect(onReply).not.toHaveBeenCalled();
      expect(result.current.swipeX).toBe(0);
      expect(result.current.isReplyReady).toBe(false);
   });
});
