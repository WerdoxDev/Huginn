import type { ComponentProps, ReactNode } from "react";

import AttachmentElement from "@components/editor/AttachmentElement";
import EmbedElement from "@components/editor/EmbedElement";
import BaseModal from "@components/modal/BaseModal";
import MagnifiedMediaModal from "@components/modal/MagnifiedMediaModal";
import { MessageContext } from "@contexts/MessageProvider";
import { useBackButtonManager } from "@hooks/useBackButtonManager";
import { ExpressionType } from "@huginnjs/shared";
import { clientStore } from "@stores/clientStore";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { modalsStore, useModals } from "@stores/modalsStore";
import { storageStore } from "@stores/storageStore";
import { windowStore } from "@stores/windowStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({ back: undefined as (() => void) | undefined }));
vi.mock("@capacitor/app", () => ({
   App: {
      addListener: vi.fn(async (event: string, listener: () => void) => {
         if (event === "backButton") native.back = listener;
         return { remove: vi.fn() };
      }),
      removeAllListeners: vi.fn(),
   },
}));

function Viewer() {
   useBackButtonManager();
   const { magnifiedMedia, updateModals } = useModals();
   return (
      <BaseModal
         modal={magnifiedMedia}
         onClose={() => updateModals({ magnifiedMedia: { isOpen: false } })}
         renderChildren={<MagnifiedMediaModal />}
         headless
      />
   );
}

const attachment = {
   id: "attachment",
   url: "attachments/movie.mp4?signature=valid",
   filename: "movie.mp4",
   size: 1000,
   width: 640,
   height: 360,
   contentType: "video/mp4",
};

const expression = {
   id: "expression",
   type: ExpressionType.UPLOADED,
   url: "gifs/cat.webm?ex=2000000000&hm=signature",
   src: "gifs/cat.webm?ex=2000000000&hm=signature",
   contentType: "video/webm",
   title: "Cat",
   width: 640,
   height: 360,
};

function messageMedia(children: ReactNode) {
   return (
      <MessageContext.Provider
         value={
            { message: { id: "message", channelId: "channel", isPreview: true }, options: { disableContextMenu: true } } as ComponentProps<
               typeof MessageContext.Provider
            >["value"]
         }
      >
         {children}
      </MessageContext.Provider>
   );
}

function renderMedia(children: ReactNode) {
   const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
   return render(
      <QueryClientProvider client={queryClient}>
         <ContextMenuProvider>
            {messageMedia(children)}
            <Viewer />
         </ContextMenuProvider>
      </QueryClientProvider>,
   );
}

beforeEach(async () => {
   vi.stubGlobal(
      "ResizeObserver",
      class {
         observe() {}
         unobserve() {}
         disconnect() {}
      },
   );
   vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 640, 360));
   vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(640);
   vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(360);
   Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
   Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
   Element.prototype.requestFullscreen = vi.fn(async function (this: Element) {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: this });
      document.dispatchEvent(new Event("fullscreenchange"));
   });
   document.exitFullscreen = vi.fn(async () => {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
      document.dispatchEvent(new Event("fullscreenchange"));
   });
   windowStore.setState({ focused: true, fullscreen: false });
   clientStore.setState({ urls: { cdn: "https://cdn.example/cdn" } as NonNullable<ReturnType<typeof clientStore.getState>["urls"]> });
   await storageStore.getState().updateSettings({ mediaVolume: 37 });
   vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: false });
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
   });
   vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", { configurable: true, value: true });
      this.dispatchEvent(new Event("pause"));
   });
   vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});

afterEach(() => {
   cleanup();
   modalsStore.getState().updateModals({ magnifiedMedia: { isOpen: false } });
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

describe("message media viewer", () => {
   it("mutes and restores the saved volume on mobile", async () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
      renderMedia(<AttachmentElement {...attachment} />);
      fireEvent.click(screen.getByRole("button", { name: "Open video" }));
      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      fireEvent.loadedData(video);
      fireEvent.click(await within(dialog).findByRole("button", { name: "Mute" }));
      expect(video.volume).toBe(0);
      fireEvent.click(within(dialog).getByRole("button", { name: "Unmute" }));
      expect(video.volume).toBe(0.37);
   });

   it.each(["loading", "failure"])("stops a video and restores focus when dismissed during %s", async (state) => {
      renderMedia(<AttachmentElement {...attachment} />);
      const opener = screen.getByRole("button", { name: "Open video" });
      opener.focus();
      fireEvent.click(opener);
      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      if (state === "failure") fireEvent.error(video);
      fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
      expect(video.paused).toBe(true);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(video.getAttribute("src")).toBeNull();
      await waitFor(() => expect(document.activeElement).toBe(opener));
   });

   it("can dismiss while playback is pending and ignores its later rejection", async () => {
      let rejectPlayback!: (reason: Error) => void;
      vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(
         () =>
            new Promise((_resolve, reject) => {
               rejectPlayback = reject;
            }),
      );
      renderMedia(<AttachmentElement {...attachment} />);
      fireEvent.click(screen.getByRole("button", { name: "Open video" }));
      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      fireEvent.click(within(dialog).getByRole("button", { name: "Close media viewer" }));
      await act(async () => rejectPlayback(new DOMException("Playback aborted", "AbortError")));
      expect(video.paused).toBe(true);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(video.getAttribute("src")).toBeNull();
   });

   it("uses native back to exit fullscreen before dismissing the viewer", async () => {
      const { container } = renderMedia(<AttachmentElement {...attachment} />);
      fireEvent.click(container.querySelector("video")!);
      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      fireEvent.loadedData(video);
      const fullscreen = await within(dialog).findByRole("button", { name: /^Fullscreen$/ });
      await act(async () => fireEvent.click(fullscreen));

      await act(async () => native.back!());
      expect(document.fullscreenElement).toBeNull();
      expect(screen.getByRole("dialog")).toBe(dialog);
      expect(video.paused).toBe(false);
      act(() => native.back!());
      expect(video.paused).toBe(true);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
   });

   it.each([true, false])("retains the same video session through native fullscreen with playing=%s", async (playing) => {
      const { container } = renderMedia(<AttachmentElement {...attachment} />);
      fireEvent.click(container.querySelector("video")!);
      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      fireEvent.loadedData(video);
      if (!playing) fireEvent.click(video);
      video.currentTime = 23;
      fireEvent.click(await within(dialog).findByRole("button", { name: "Mute" }));
      expect(video.volume).toBe(0);

      const fullscreen = await within(dialog).findByRole("button", { name: /^Fullscreen$/ });
      await act(async () => fireEvent.click(fullscreen));
      expect(document.fullscreenElement).toBeTruthy();
      expect(dialog.querySelector("video")).toBe(video);
      expect(video.currentTime).toBe(23);
      expect(video.paused).toBe(!playing);
      expect(video.volume).toBe(0);
      await act(async () => fireEvent.click(within(dialog).getByRole("button", { name: "Exit fullscreen" })));
      expect(document.fullscreenElement).toBeNull();
      expect(screen.getByRole("dialog")).toBe(dialog);
      expect(dialog.querySelector("video")).toBe(video);
      expect(video.currentTime).toBe(23);
      expect(video.paused).toBe(!playing);
      fireEvent.click(within(dialog).getByRole("button", { name: "Unmute" }));
      expect(video.volume).toBe(0.37);
   });

   it("pauses, seeks, replays, stops on dismissal, and restarts on reopening", async () => {
      const { container } = renderMedia(<AttachmentElement {...attachment} />);
      const preview = container.querySelector("video")!;
      fireEvent.click(preview);
      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      Object.defineProperty(video, "duration", { configurable: true, value: 100 });
      fireEvent.loadedMetadata(video);
      fireEvent.loadedData(video);
      fireEvent.click(video);
      expect(video.paused).toBe(true);
      fireEvent.click(video);
      expect(video.paused).toBe(false);
      const seek = await within(dialog).findByRole("slider");
      fireEvent.keyDown(seek, { key: "ArrowRight" });
      expect(video.currentTime).toBeGreaterThan(0);

      video.currentTime = 100;
      Object.defineProperty(video, "ended", { configurable: true, value: true });
      fireEvent.ended(video);
      fireEvent.click(within(dialog).getByRole("button", { name: "Replay" }));
      expect(video.currentTime).toBe(0);
      expect(video.paused).toBe(false);

      video.currentTime = 42;
      fireEvent.click(within(dialog).getByRole("button", { name: "Close media viewer" }));
      expect(video.paused).toBe(true);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(video.getAttribute("src")).toBeNull();
      fireEvent.click(preview);
      const reopened = (await screen.findByRole("dialog")).querySelector("video")!;
      expect(reopened.currentTime).toBe(0);
      expect(reopened.volume).toBe(0.37);
      expect(reopened.paused).toBe(false);
   });

   it("opens an ordinary video from a nonplaying preview in a fresh viewer session", async () => {
      const { container } = renderMedia(<AttachmentElement {...attachment} />);
      const preview = container.querySelector("video")!;
      fireEvent.loadedData(preview);
      expect(preview.autoplay).toBe(false);
      expect(preview.controls).toBe(false);
      expect(preview.paused).toBe(true);
      expect(preview.play).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "Play" })).toBeNull();

      fireEvent.click(preview);

      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      expect(video).not.toBe(preview);
      expect(video.currentTime).toBe(0);
      expect(video.volume).toBe(0.37);
      expect(video.paused).toBe(false);
      expect(video.loop).toBe(false);
      fireEvent.loadedData(video);
      expect(await within(dialog).findByRole("button", { name: "Pause" })).toBeTruthy();
   });

   it.each([
      ["WebM attachment", <AttachmentElement {...attachment} url="attachments/movie.webm" contentType="video/webm" />],
      ["ordinary video embed", <EmbedElement embedType="rich" video={{ url: "https://example.com/movie.mp4", width: 640, height: 360 }} />],
      ["ordinary video embed with uploaded media metadata", <EmbedElement embedType="video" media={expression} />],
      [
         "ordinary video embed with a thumbnail",
         <EmbedElement
            embedType="rich"
            thumbnail={{ url: "https://example.com/poster.jpg", width: 640, height: 360 }}
            video={{ url: "https://example.com/movie.mp4", width: 640, height: 360 }}
         />,
      ],
      [
         "ordinary video embed with a GIF thumbnail",
         <EmbedElement
            embedType="video"
            thumbnail={{ url: "https://example.com/poster.gif", width: 640, height: 360 }}
            video={{ url: "https://example.com/movie.mp4", width: 640, height: 360 }}
         />,
      ],
   ])("opens %s as an ordinary video", async (_name, media) => {
      const { container } = renderMedia(media);
      const preview = container.querySelector("video, img")!;
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
      fireEvent.click(preview);
      const dialog = await screen.findByRole("dialog");
      const video = dialog.querySelector("video")!;
      expect(video).toBeTruthy();
      expect(video.loop).toBe(false);
      expect(video.muted).toBe(false);
      expect(video.paused).toBe(false);
      fireEvent.loadedData(video);
      expect(await within(dialog).findByRole("button", { name: "Pause" })).toBeTruthy();
   });

   it.each([
      ["image attachment", <AttachmentElement {...attachment} url="attachments/photo.png" filename="photo.png" contentType="image/png" />],
      ["GIF attachment", <AttachmentElement {...attachment} url="attachments/cat.gif" filename="cat.gif" contentType="image/gif" />],
      ["image GIF embed", <EmbedElement embedType="gif" media={{ ...expression, src: "gifs/cat.gif", contentType: "image/gif" }} />],
      ["image sticker embed", <EmbedElement embedType="sticker" media={{ ...expression, src: "stickers/cat.webp", contentType: "image/webp" }} />],
      ["WebM GIF embed", <EmbedElement embedType="gif" media={expression} />],
      ["video sticker embed", <EmbedElement embedType="sticker" media={{ ...expression, src: "stickers/cat.mp4", contentType: "video/mp4" }} />],
      ["provider GIF embed", <EmbedElement embedType="gif" video={{ url: "https://example.com/cat.webm", width: 640, height: 360 }} />],
   ])("preserves expression and image behavior for %s", async (_name, media) => {
      const { container } = renderMedia(media);
      const preview = container.querySelector("video, img")!;
      fireEvent.click(preview);
      const dialog = await screen.findByRole("dialog");
      expect(dialog.querySelector("video, img")!.tagName).toBe(preview.tagName);
      expect(within(dialog).queryByRole("button", { name: /Play|Pause|Replay|Fullscreen/ })).toBeNull();
      if (preview instanceof HTMLVideoElement) {
         const enlarged = dialog.querySelector("video")!;
         expect(preview.muted).toBe(true);
         expect(preview.loop).toBe(true);
         expect(enlarged.muted).toBe(true);
         expect(enlarged.loop).toBe(true);
         act(() => windowStore.setState({ focused: false }));
         expect(preview.paused).toBe(true);
         expect(enlarged.paused).toBe(true);
         act(() => windowStore.setState({ focused: true }));
         expect(preview.paused).toBe(false);
         expect(enlarged.paused).toBe(false);
      }
   });
});
