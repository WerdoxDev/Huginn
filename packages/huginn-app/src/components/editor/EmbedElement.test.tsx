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
   add: vi.fn().mockResolvedValue(undefined),
   remove: vi.fn().mockResolvedValue(undefined),
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
   mocks.useExpressions.mockReturnValue({ find: mocks.find, add: mocks.add, remove: mocks.remove, isPending: false });
   vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
   vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
   cleanup();
   vi.restoreAllMocks();
   vi.useRealTimers();
});

describe("EmbedElement", () => {
   it("preserves signed uploaded GIF URLs for playback, magnification, saving and context menus", () => {
      render(embed({ embedType: "gif", media: uploaded }));
      const image = screen.getByRole("img");
      const src = `https://cdn.example/cdn/${uploaded.src}`;
      expect(image.getAttribute("src")).toBe(src);
      fireEvent.click(image);
      expect(mocks.updateModals).toHaveBeenCalledWith({
         magnifiedMedia: { isOpen: true, url: src, width: 640, height: 320, type: "image", filename: uploaded.title },
      });
      fireEvent.contextMenu(image);
      const menu = mocks.openMenu.mock.calls[0][0];
      expect(menu.mediaUrl).toBe(src);
      expect(menu.imgElement).toBe(image);
      expect(menu.gif).toBe(uploaded);
      fireEvent.click(screen.getByRole("button", { name: "Add to GIFs" }));
      expect(mocks.add).toHaveBeenCalledWith({ id: uploaded.id, type: uploaded.type, ex: uploaded.ex, hm: uploaded.hm });
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
      expect(mocks.remove).toHaveBeenCalledWith(sticker);
   });
   it("loops video GIFs and resolves Klipy save references without media metadata", () => {
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
      expect(mocks.add).toHaveBeenCalledWith({ id: "cat", type: ExpressionType.KLIPY });
      fireEvent.click(video);
      expect(mocks.updateModals.mock.calls[0][0].magnifiedMedia.type).toBe("video");
   });
   it("keeps rich embed text and ordinary video controls", () => {
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
