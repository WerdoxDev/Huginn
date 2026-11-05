import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
   isMobile: true,
   isFullscreen: true,
   toggleFullscreen: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock("@hooks/useFullscreen", () => ({
   useFullscreen: () => ({ isFullscreen: mocks.isFullscreen, toggleFullscreen: mocks.toggleFullscreen }),
}));

import VideoPlayer from "./VideoPlayer";

function renderPlayer() {
   const result = render(<VideoPlayer url="/video.mp4" width={640} height={360} />);
   const video = result.container.querySelector("video")!;
   fireEvent.loadedData(video);
   return { ...result, video };
}

function advanceTime(milliseconds: number) {
   act(() => {
      vi.advanceTimersByTime(milliseconds);
   });
}

describe("VideoPlayer mobile fullscreen controls", () => {
   beforeEach(() => {
      vi.useFakeTimers();
      mocks.isMobile = true;
      mocks.isFullscreen = true;
      mocks.toggleFullscreen.mockClear();
      vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
         this.dispatchEvent(new Event("play"));
         return Promise.resolve();
      });
      vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
         this.dispatchEvent(new Event("pause"));
      });
   });

   afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
      vi.useRealTimers();
   });

   it("toggles controls with video taps without changing playback", () => {
      const { video } = renderPlayer();

      fireEvent.click(video);
      expect(screen.queryByRole("button", { name: "Play" })).toBeNull();

      fireEvent.click(video);
      expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
      expect(video.play).not.toHaveBeenCalled();
      expect(video.pause).not.toHaveBeenCalled();
   });

   it("plays and pauses from the central button, keeping paused controls visible", () => {
      const { video } = renderPlayer();

      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      expect(video.play).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole("button", { name: "Pause" }));
      expect(video.pause).toHaveBeenCalledOnce();

      advanceTime(5000);
      expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
   });

   it("auto-hides after three seconds of playback and gives revealed controls a fresh delay", () => {
      const { video } = renderPlayer();
      fireEvent.play(video);

      advanceTime(2999);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
      advanceTime(1);
      expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();

      fireEvent.click(video);
      advanceTime(2000);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
      advanceTime(1000);
      expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
   });

   it("suspends auto-hide during a control gesture and restarts it on release", () => {
      const { video } = renderPlayer();
      fireEvent.play(video);
      const controls = screen.getByRole("group").parentElement!;

      advanceTime(2000);
      fireEvent.pointerDown(controls);
      advanceTime(5000);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();

      fireEvent.pointerUp(controls);
      advanceTime(2999);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
      advanceTime(1);
      expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
   });

   it.each(["pause", "ended"] as const)("reveals hidden controls when playback emits %s", (event) => {
      const { video } = renderPlayer();
      fireEvent.play(video);
      advanceTime(3000);

      fireEvent(video, new Event(event));
      advanceTime(5000);
      expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
   });

   it("restores controls after leaving and re-entering fullscreen", () => {
      const { video, rerender } = renderPlayer();
      fireEvent.play(video);
      advanceTime(3000);

      mocks.isFullscreen = false;
      rerender(<VideoPlayer url="/video.mp4" width={640} height={360} />);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();

      mocks.isFullscreen = true;
      rerender(<VideoPlayer url="/video.mp4" width={640} height={360} />);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
      advanceTime(3000);
      expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
   });

   it("enters fullscreen and plays when tapping an inline mobile video", async () => {
      mocks.isFullscreen = false;
      const { video } = renderPlayer();

      await act(async () => {
         fireEvent.click(video);
      });

      expect(mocks.toggleFullscreen).toHaveBeenCalledOnce();
      expect(video.play).toHaveBeenCalledOnce();
      advanceTime(5000);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
   });

   it("keeps desktop click-to-play behavior", () => {
      mocks.isMobile = false;
      const { video } = renderPlayer();

      fireEvent.click(video);
      expect(video.play).toHaveBeenCalledOnce();
      advanceTime(5000);
      expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
      fireEvent.click(video);
      expect(video.pause).toHaveBeenCalledOnce();
   });
});
