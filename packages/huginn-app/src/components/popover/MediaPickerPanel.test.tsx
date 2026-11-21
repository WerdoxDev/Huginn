import { CONSTANTS, ExpressionType, type APIExpression, type ExpressionKind } from "@huginnjs/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MediaPickerPanel from "./MediaPickerPanel";

const mocks = vi.hoisted(() => ({
   gifs: { getAll: vi.fn(), upload: vi.fn(), getCategories: vi.fn(), getTrending: vi.fn(), search: vi.fn() },
   stickers: { getAll: vi.fn(), upload: vi.fn(), getCategories: vi.fn(), getTrending: vi.fn(), search: vi.fn() },
   openFileDialog: vi.fn(),
   updateModals: vi.fn(),
   showError: vi.fn(),
   revokeObjectURL: vi.fn(),
}));

vi.mock("@hooks/useContainerWidth", () => ({ useContainerWidth: () => [undefined, 360] }));
vi.mock("@hooks/useFileDialog", () => ({ useFileDialog: () => ({ openFileDialog: mocks.openFileDialog }) }));
vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => mocks,
   useClientStore: () => ({ urls: { cdn: "https://cdn.example" } }),
}));
vi.mock("@stores/userStore", () => ({ useThisUser: () => ({ user: { id: "1" } }) }));
vi.mock("@stores/contextMenuStore", () => ({ useContextMenu: () => ({ open: vi.fn() }) }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ showError: mocks.showError, updateModals: mocks.updateModals }) }));

function media(title: string): APIExpression {
   return {
      id: title,
      title,
      type: ExpressionType.KLIPY,
      src: "https://example.com/media.webp",
      url: "https://klipy.com/stickers/media",
      contentType: "image/webp",
      width: 100,
      height: 100,
   };
}

const caches: QueryClient[] = [];

afterEach(() => {
   for (const cache of caches.splice(0)) cache.clear();
});

function setup(kind: ExpressionKind, isOpen = true) {
   const onSelect = vi.fn();
   const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
   caches.push(queryClient);
   const panel = (open: boolean) => (
      <QueryClientProvider client={queryClient}>
         <MediaPickerPanel kind={kind} isOpen={open} onSelect={onSelect} />
      </QueryClientProvider>
   );
   const result = render(panel(isOpen));
   return { onSelect, reopen: () => result.rerender(panel(true)) };
}

beforeEach(() => {
   vi.resetAllMocks();
   mocks.gifs.getCategories.mockResolvedValue({
      categories: [{ name: "Happy", src: "https://example.com/happy.gif" }],
      trendingGif: { ...media("Trending preview"), contentType: "video/mp4", src: "https://example.com/trending.mp4" },
   });
   mocks.stickers.getCategories.mockResolvedValue({
      categories: [{ name: "Happy", src: "https://example.com/happy.webp" }],
      trendingSticker: media("Trending preview"),
   });
   for (const kind of ["gifs", "stickers"] as const) {
      const items = [media("Saved cat")];
      mocks[kind].getAll.mockImplementation(async () => [...items]);
      mocks[kind].upload.mockImplementation(async () => {
         const uploaded = { ...media("Uploaded cat"), type: ExpressionType.UPLOADED };
         items.push(uploaded);
         return uploaded;
      });
      mocks[kind].getTrending.mockResolvedValue([media("Trending result")]);
      mocks[kind].search.mockResolvedValue([media("Search result")]);
   }
});

describe.each([
   ["gifs", "GIFs"],
   ["stickers", "Stickers"],
] as const)("%s categories", (kind, label) => {
   it("opens All with category tiles and a full-width Trending preview", async () => {
      setup(kind);
      expect(mocks[kind].getCategories).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));

      const happy = await screen.findByRole("button", { name: "Happy" });
      expect(happy.querySelector("img")).toBeTruthy();
      const trending = screen.getByRole("button", { name: "Trending" });
      expect(trending.classList.contains("col-span-2")).toBe(true);
      expect(trending.querySelector(kind === "gifs" ? "video" : "img")).toBeTruthy();
      expect(mocks[kind].getCategories).toHaveBeenCalledTimes(1);
      expect(mocks[kind].getTrending).not.toHaveBeenCalled();
      expect(mocks[kind].search).not.toHaveBeenCalled();
   });

   it("searches a chosen category, selects its media, and returns to the category list", async () => {
      const { onSelect } = setup(kind);
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      fireEvent.click(await screen.findByRole("button", { name: "Happy" }));

      fireEvent.click(await screen.findByRole("button", { name: "Search result" }));
      expect(onSelect).toHaveBeenCalledWith(media("Search result"));
      expect(mocks[kind].search).toHaveBeenCalledWith("Happy", 24, 1);
      expect(mocks[kind].getTrending).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Back to categories" }));
      expect(await screen.findByRole("button", { name: "Happy" })).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Search result" })).toBeNull();
   });

   it("loads Trending and paginates within it", async () => {
      mocks[kind].getTrending
         .mockResolvedValueOnce(Array.from({ length: 24 }, (_, index) => media(`Trending ${index}`)))
         .mockResolvedValueOnce([media("Next page")]);
      setup(kind);
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      fireEvent.click(await screen.findByRole("button", { name: "Trending" }));

      const item = await screen.findByRole("button", { name: "Trending 0" });
      expect(screen.getByText("Trending Gifs")).toBeTruthy();
      expect(mocks[kind].getTrending).toHaveBeenCalledWith(24, 1);
      fireEvent.scroll(item.closest(".overflow-y-scroll")!);

      expect(await screen.findByRole("button", { name: "Next page" })).toBeTruthy();
      expect(mocks[kind].getTrending).toHaveBeenCalledWith(24, 2);
      expect(mocks[kind].search).not.toHaveBeenCalled();
   });

   it("supports typed searches after leaving Trending and clears back to categories", async () => {
      setup(kind);
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      fireEvent.click(await screen.findByRole("button", { name: "Trending" }));
      await screen.findByRole("button", { name: "Trending result" });

      fireEvent.click(screen.getByRole("button", { name: "Back to categories" }));
      const input = screen.getByPlaceholderText(`Search ${label}...`);
      mocks[kind].search.mockResolvedValue([media("Cats result")]);
      fireEvent.change(input, { target: { value: "cats" } });
      await waitFor(() => expect(mocks[kind].search).toHaveBeenCalledWith("cats", 24, 1));
      expect(await screen.findByRole("button", { name: "Cats result" })).toBeTruthy();
      expect(screen.queryByText("Trending Gifs")).toBeNull();

      fireEvent.change(input, { target: { value: "" } });
      expect(await screen.findByRole("button", { name: "Happy" })).toBeTruthy();
   });

   it("keeps Your media available and resets All to categories after switching tabs", async () => {
      setup(kind);
      expect(await screen.findByRole("button", { name: "Saved cat" })).toBeTruthy();
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      fireEvent.click(await screen.findByRole("button", { name: "Happy" }));
      await screen.findByRole("button", { name: "Search result" });

      fireEvent.click(screen.getByRole("tab", { name: `Your ${label}` }));
      expect(screen.getByRole("button", { name: "Saved cat" })).toBeTruthy();
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      expect(await screen.findByRole("button", { name: "Happy" })).toBeTruthy();
   });

   it("retries category failures", async () => {
      mocks[kind].getCategories.mockRejectedValueOnce(new Error("Unavailable"));
      setup(kind);
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      fireEvent.click(await screen.findByRole("button", { name: `Could not load ${label}. Try again.` }));

      expect(await screen.findByRole("button", { name: "Happy" })).toBeTruthy();
      expect(mocks[kind].getCategories).toHaveBeenCalledTimes(2);
   });

   it("waits for the picker to open before requesting categories", async () => {
      const { reopen } = setup(kind, false);
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      expect(mocks[kind].getCategories).not.toHaveBeenCalled();
      reopen();
      expect(await screen.findByRole("button", { name: "Happy" })).toBeTruthy();
   });
});

it("keeps sticker Trending available when there is no preview", async () => {
   mocks.stickers.getCategories.mockResolvedValue({ categories: [] });
   setup("stickers");
   fireEvent.click(screen.getByRole("tab", { name: "All Stickers" }));
   fireEvent.click(await screen.findByRole("button", { name: "Trending" }));
   expect(await screen.findByRole("button", { name: "Trending result" })).toBeTruthy();
});

describe.each([
   ["gifs", "Upload GIF", "image/gif", "image/gif", "gif"],
   ["stickers", "Upload sticker", "image/jpeg", "image/png", "sticker"],
   ["stickers", "Upload sticker", "image/gif", "image/gif", "sticker"],
] as const)("%s uploads (%s, %s)", (kind, button, mimeType, croppedMimeType, cropType) => {
   beforeEach(() => {
      vi.stubGlobal(
         "URL",
         class extends URL {
            static revokeObjectURL = mocks.revokeObjectURL;
         },
      );
      mocks.openFileDialog.mockResolvedValue({
         file: new File(["original"], "cat", { type: mimeType }),
         dataUrl: "blob:selected-media",
         mimeType,
      });
   });

   afterEach(() => vi.unstubAllGlobals());

   it("waits for crop confirmation, then uploads the cropped bytes and content type", async () => {
      setup(kind);
      fireEvent.click(screen.getByRole("button", { name: button }));

      await waitFor(() => expect(mocks.updateModals).toHaveBeenCalledOnce());
      const modal = mocks.updateModals.mock.calls[0][0].imageCrop;
      expect(modal).toMatchObject({ isOpen: true, originalImageData: "blob:selected-media", mimeType, cropType });
      expect(mocks[kind].upload).not.toHaveBeenCalled();
      expect(mocks.revokeObjectURL).not.toHaveBeenCalled();

      await act(() => modal.callback(`data:${croppedMimeType};base64,AQID`));

      expect(mocks[kind].upload).toHaveBeenCalledOnce();
      const upload = mocks[kind].upload.mock.calls[0][0];
      expect(upload).toMatchObject({ name: "cat", contentType: croppedMimeType });
      expect(new Uint8Array(upload.data)).toEqual(new Uint8Array([1, 2, 3]));
      expect(await screen.findByRole("button", { name: "Uploaded cat" })).toBeTruthy();
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);
      expect(mocks.showError).not.toHaveBeenCalled();
   });

   it("disables uploads while pending, reports failure once, and lets the user retry", async () => {
      const upload = Promise.withResolvers<APIExpression>();
      mocks[kind].upload.mockReturnValueOnce(upload.promise);
      setup(kind);
      await screen.findByRole("button", { name: "Saved cat" });
      const buttonElement = screen.getByRole("button", { name: button });
      fireEvent.click(buttonElement);
      await waitFor(() => expect(mocks.updateModals).toHaveBeenCalledOnce());
      let confirmation: Promise<void>;

      act(() => {
         confirmation = mocks.updateModals.mock.calls[0][0].imageCrop.callback(`data:${croppedMimeType};base64,AQID`);
      });

      await waitFor(() => expect(buttonElement.hasAttribute("disabled")).toBe(true));
      expect(screen.queryByRole("button", { name: "Uploaded cat" })).toBeNull();
      await act(async () => {
         upload.reject(new Error("Upload failed"));
         await confirmation;
      });
      await waitFor(() => expect(buttonElement.hasAttribute("disabled")).toBe(false));
      expect(mocks.showError).toHaveBeenCalledExactlyOnceWith("Upload failed");
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("button", { name: "Uploaded cat" })).toBeNull();

      fireEvent.click(buttonElement);
      await waitFor(() => expect(mocks.updateModals).toHaveBeenCalledTimes(2));
      await act(() => mocks.updateModals.mock.calls[1][0].imageCrop.callback(`data:${croppedMimeType};base64,AQID`));

      expect(await screen.findByRole("button", { name: "Uploaded cat" })).toBeTruthy();
      expect(mocks[kind].upload).toHaveBeenCalledTimes(2);
      expect(mocks.showError).toHaveBeenCalledTimes(1);
   });

   it.each(["empty", "oversized"])("releases %s files without opening the cropper or uploading", async (failure) => {
      const max = kind === "gifs" ? CONSTANTS.GIF_MAX_BYTES : CONSTANTS.STICKER_MAX_BYTES;
      const file = new File(["original"], "cat", { type: mimeType });
      Object.defineProperty(file, "size", { value: failure === "empty" ? 0 : max + 1 });
      mocks.openFileDialog.mockResolvedValue({ file, dataUrl: "blob:oversized", mimeType });
      setup(kind);
      fireEvent.click(screen.getByRole("button", { name: button }));

      await waitFor(() => expect(mocks.showError).toHaveBeenCalledOnce());
      expect(mocks.revokeObjectURL).toHaveBeenCalledWith("blob:oversized");
      expect(mocks.updateModals).not.toHaveBeenCalled();
      expect(mocks[kind].upload).not.toHaveBeenCalled();
   });

   it.each(["empty", "oversized"])("rejects %s cropped bytes before uploading", async (failure) => {
      setup(kind);
      fireEvent.click(screen.getByRole("button", { name: button }));
      await waitFor(() => expect(mocks.updateModals).toHaveBeenCalledOnce());
      const max = kind === "gifs" ? CONSTANTS.GIF_MAX_BYTES : CONSTANTS.STICKER_MAX_BYTES;
      const encoded = failure === "empty" ? "" : "AAAA".repeat(Math.ceil((max + 1) / 3));

      await act(() => mocks.updateModals.mock.calls[0][0].imageCrop.callback(`data:${croppedMimeType};base64,${encoded}`));

      expect(mocks.showError).toHaveBeenCalledExactlyOnceWith(`Choose a file smaller than ${kind === "gifs" ? 25 : 10} MB.`);
      expect(mocks[kind].upload).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "Uploaded cat" })).toBeNull();
   });

   it("does nothing when file selection is cancelled", async () => {
      mocks.openFileDialog.mockResolvedValue(null);
      setup(kind);
      fireEvent.click(screen.getByRole("button", { name: button }));

      await waitFor(() => expect(mocks.openFileDialog).toHaveResolvedWith(null));
      expect(mocks.updateModals).not.toHaveBeenCalled();
      expect(mocks[kind].upload).not.toHaveBeenCalled();
      expect(mocks.revokeObjectURL).not.toHaveBeenCalled();
   });
});
