import type { APIExpression } from "@huginnjs/shared";
import type { ComponentProps } from "react";

import { MessageContext } from "@contexts/MessageProvider";
import { ExpressionType } from "@huginnjs/shared";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
   getMessage: vi.fn(),
   openMenu: vi.fn(),
   openUrl: vi.fn(),
   updateModals: vi.fn(),
   toggle: vi.fn().mockResolvedValue(undefined),
   find: vi.fn(),
   useExpressions: vi.fn(),
}));
vi.mock("@contexts/MessageProvider", async () => {
   const react = await vi.importActual<typeof import("react")>("react");
   return { MessageContext: react.createContext(null) };
});
vi.mock("@hooks/useOpen", () => ({ useOpen: () => ({ openUrl: mocks.openUrl }) }));
vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => false }));
vi.mock("@hooks/useExpressions", () => ({ useExpressions: mocks.useExpressions }));
vi.mock("@stores/clientStore", () => ({
   initializeClient: vi.fn(),
   setHostnamesFromSettings: vi.fn(),
   useClient: () => ({ channels: { getMessage: mocks.getMessage } }),
   useClientStore: () => ({ urls: { cdn: "https://cdn.example/cdn" } }),
}));
vi.mock("@stores/storageStore", () => ({
   initStorageStoreEarly: vi.fn(),
   useStorage: () => ({ mediaVolume: 100 }),
   useStorageStore: () => ({ updateSettings: vi.fn() }),
}));
vi.mock("@stores/windowStore", () => ({ useHuginnWindow: () => ({ focused: true }) }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals: mocks.updateModals }) }));
vi.mock("@stores/contextMenuStore", () => ({ useContextMenu: () => ({ open: mocks.openMenu }) }));

import EmbedElement from "./EmbedElement";

const uploaded: APIExpression = {
   id: "123",
   type: ExpressionType.UPLOADED,
   title: "A GIF",
   url: "gifs/123.gif?ex=2000000000&hm=signature",
   src: "gifs/123.gif?ex=2000000000&hm=signature",
   width: 640,
   height: 320,
   contentType: "image/gif",
   ex: Math.floor(Date.now() / 1000) + 3600,
   hm: "signature",
};
function embed(props: ComponentProps<typeof EmbedElement>, options: { preview?: boolean; disableContextMenu?: boolean } = {}) {
   return (
      <MessageContext.Provider
         value={
            {
               message: { id: "message", channelId: "channel", isPreview: options.preview },
               options: { disableContextMenu: options.disableContextMenu },
            } as ComponentProps<typeof MessageContext.Provider>["value"]
         }
      >
         <EmbedElement {...props} />
      </MessageContext.Provider>
   );
}
beforeEach(() => {
   vi.clearAllMocks();
   mocks.find.mockReturnValue(undefined);
   mocks.useExpressions.mockReturnValue({ find: mocks.find, toggle: mocks.toggle, isPending: false });
   vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
   vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
   cleanup();
   vi.restoreAllMocks();
   vi.useRealTimers();
});

describe("EmbedElement", () => {
   it.each(["gif", "sticker"] as const)("keeps the loaded %s when acknowledgement refreshes its signature", (embedType) => {
      const { rerender } = render(embed({ embedType, media: uploaded }, { preview: true }));
      const image = screen.getByRole("img");
      const src = image.getAttribute("src");
      fireEvent.load(image);
      const refreshed = { ...uploaded, src: "gifs/123.gif?ex=2000003600&hm=new-signature" };

      rerender(embed({ embedType, media: refreshed }));

      expect(screen.getByRole("img")).toBe(image);
      expect(image.getAttribute("src")).toBe(src);
      fireEvent.click(image);
      expect(mocks.updateModals.mock.lastCall?.[0].magnifiedMedia.url).toBe(`https://cdn.example/cdn/${refreshed.src}`);
      fireEvent.contextMenu(image);
      expect(mocks.openMenu.mock.lastCall?.[0][embedType]).toBe(refreshed);
   });
   it("retries the latest signed URL if the retained image fails to load", () => {
      const { rerender } = render(embed({ embedType: "gif", media: uploaded }, { preview: true }));
      const image = screen.getByRole("img");
      const refreshed = { ...uploaded, src: "gifs/123.gif?ex=2000003600&hm=new-signature" };
      rerender(embed({ embedType: "gif", media: refreshed }));

      fireEvent.error(image);

      expect(image.getAttribute("src")).toBe(`https://cdn.example/cdn/${refreshed.src}`);
      fireEvent.load(image);
      expect(image.classList.contains("hidden")).toBe(false);
   });
   it("uses a refreshed URL when the preview already failed before acknowledgement", () => {
      const { rerender } = render(embed({ embedType: "gif", media: uploaded }, { preview: true }));
      const image = screen.getByRole("img");
      fireEvent.error(image);
      const refreshed = { ...uploaded, src: "gifs/123.gif?ex=2000003600&hm=new-signature" };

      rerender(embed({ embedType: "gif", media: refreshed }));

      expect(image.getAttribute("src")).toBe(`https://cdn.example/cdn/${refreshed.src}`);
      fireEvent.load(image);
      expect(image.classList.contains("hidden")).toBe(false);
   });
   it("changes playback URLs when the asset or its transformation changes", () => {
      const { rerender } = render(embed({ embedType: "gif", media: uploaded }));
      const image = screen.getByRole("img");
      const transformed = { ...uploaded, src: `${uploaded.src}&width=100` };
      rerender(embed({ embedType: "gif", media: transformed }));
      expect(image.getAttribute("src")).toBe(`https://cdn.example/cdn/${transformed.src}`);

      const different = { ...uploaded, id: "456", src: "gifs/456.gif?ex=2000003600&hm=new-signature" };
      rerender(embed({ embedType: "gif", media: different }));
      expect(image.getAttribute("src")).toBe(`https://cdn.example/cdn/${different.src}`);
   });
   it("keeps video playback when signatures refresh and retries the latest URL on error", () => {
      const media = { ...uploaded, src: "gifs/123.webm?ex=2000000000&hm=signature", contentType: "video/webm" };
      const { container, rerender } = render(embed({ embedType: "gif", media }, { preview: true }));
      const video = container.querySelector("video")!;
      const src = video.getAttribute("src");
      video.currentTime = 3;
      const refreshed = { ...media, src: "gifs/123.webm?ex=2000003600&hm=new-signature" };

      rerender(embed({ embedType: "gif", media: refreshed }));

      expect(container.querySelector("video")).toBe(video);
      expect(video.getAttribute("src")).toBe(src);
      expect(video.currentTime).toBe(3);
      fireEvent.error(video);
      expect(video.getAttribute("src")).toBe(`https://cdn.example/cdn/${refreshed.src}`);
   });
   it("preserves signed uploaded GIF URLs for playback, magnification, saving and context menus", () => {
      render(embed({ embedType: "gif", media: uploaded }));
      const image = screen.getByRole("img");
      const src = `https://cdn.example/cdn/${uploaded.src}`;
      expect(image.getAttribute("src")).toBe(src);
      fireEvent.click(image);
      expect(mocks.updateModals).toHaveBeenCalledWith({
         magnifiedMedia: {
            isOpen: true,
            url: src,
            width: 640,
            height: 320,
            type: "image",
            kind: "gif",
            origin: "embed",
            provider: ExpressionType.UPLOADED,
            filename: uploaded.title,
         },
      });
      fireEvent.contextMenu(image);
      const menu = mocks.openMenu.mock.calls[0][0];
      expect(menu.mediaUrl).toBe(src);
      expect(menu.imgElement).toBe(image);
      expect(menu.gif).toBe(uploaded);
      fireEvent.click(screen.getByRole("button", { name: "Add to GIFs" }));
      expect(mocks.toggle).toHaveBeenCalledWith(uploaded);
   });
   it("sizes stickers to 160px and uses the sticker collection", () => {
      const sticker = { ...uploaded, src: "stickers/123.webp?ex=2000000000&hm=signature", contentType: "image/webp" };
      mocks.find.mockReturnValue(sticker);
      const { container } = render(embed({ embedType: "sticker", media: sticker }));
      const image = screen.getByRole("img");
      expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe("160px");
      expect(image.getAttribute("src")).toBe(`https://cdn.example/cdn/${sticker.src}`);
      expect(screen.queryByText("GIF")).toBeNull();
      fireEvent.contextMenu(image);
      const menu = mocks.openMenu.mock.calls[0][0];
      expect(menu.sticker).toBe(sticker);
      expect(menu.imgElement).toBe(image);
      expect(mocks.useExpressions).toHaveBeenCalledWith("stickers");
      fireEvent.click(screen.getByRole("button", { name: "Remove from Stickers" }));
      expect(mocks.toggle).toHaveBeenCalledWith(sticker);
   });
   it("loops video GIFs and delegates saving without media metadata", () => {
      const { container } = render(
         embed({
            embedType: "gif",
            title: "Hidden title",
            description: "Hidden description",
            url: "https://klipy.com/gifs/cat",
            video: { url: "https://media.example/cat.webm", width: 640, height: 320 },
         }),
      );
      const video = container.querySelector("video")!;
      expect(video.getAttribute("src")).toBe("https://cdn.example/cdn/external/https%3A%2F%2Fmedia.example%2Fcat.webm");
      expect(video.loop).toBe(true);
      expect(video.muted).toBe(true);
      expect(video.playsInline).toBe(true);
      expect(screen.queryByText("Hidden title")).toBeNull();
      expect(screen.queryByText("Hidden description")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Add to GIFs" }));
      expect(mocks.toggle).toHaveBeenCalledWith({
         url: "https://klipy.com/gifs/cat",
         src: "https://media.example/cat.webm",
         width: 640,
         height: 320,
      });
      fireEvent.click(video);
      expect(mocks.updateModals.mock.calls[0][0].magnifiedMedia.type).toBe("video");
   });
   it("keeps rich embed text and shows an ordinary video preview", () => {
      const { container } = render(
         embed({
            embedType: "rich",
            title: "Title",
            description: "Description",
            url: "https://example.com",
            video: { url: "https://media.example/a.mp4" },
         }),
      );
      fireEvent.click(screen.getByText("Title"));
      expect(mocks.openUrl).toHaveBeenCalledWith("https://example.com");
      expect(screen.getByText("Description")).toBeTruthy();
      expect(container.querySelector("video")!.loop).toBe(false);
      expect(screen.queryByRole("button", { name: "Add to GIFs" })).toBeNull();
   });
   it("hides save controls in previews and respects disabled context menus", () => {
      render(
         embed({ embedType: "gif", media: { ...uploaded, ex: Math.floor(Date.now() / 1000) + 60 } }, { preview: true, disableContextMenu: true }),
      );
      expect(screen.queryByRole("button", { name: "Add to GIFs" })).toBeNull();
      fireEvent.contextMenu(screen.getByRole("img"));
      expect(mocks.openMenu).not.toHaveBeenCalled();
   });
   it("keeps uploaded media without refetching the message when its signature expires or the window regains focus or connectivity", async () => {
      vi.useFakeTimers();
      const media = { ...uploaded, ex: Math.floor(Date.now() / 1000) + 60 };
      render(embed({ embedType: "gif", media }));
      await act(() => vi.advanceTimersByTimeAsync(60_000));
      fireEvent.focus(window);
      fireEvent(window, new Event("online"));
      await act(() => vi.advanceTimersByTimeAsync(60_000));
      expect(screen.getByRole("img").getAttribute("src")).toBe(`https://cdn.example/cdn/${media.src}`);
      expect(mocks.getMessage).not.toHaveBeenCalled();
   });
});
