import type { APISticker } from "@huginnjs/shared";

import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StickerPickerPanel from "./StickerPickerPanel";

const fileDialog = vi.hoisted(() => ({ openFileDialog: vi.fn(), revokeObjectURL: vi.fn() }));
vi.mock("@hooks/useFileDialog", () => ({ useFileDialog: () => fileDialog }));

const menu = vi.hoisted(() => ({ open: vi.fn() }));
vi.mock("@stores/contextMenuStore", () => ({ useContextMenu: () => menu }));
const modals = vi.hoisted(() => ({ showError: vi.fn(), updateModals: vi.fn() }));
vi.mock("@stores/modalsStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/modalsStore")>()),
   useModals: () => modals,
}));

const stickers = vi.hoisted(() => ({ getTrending: vi.fn(), search: vi.fn(), getMine: vi.fn(), upload: vi.fn(), delete: vi.fn() }));
vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => ({ stickers }),
}));
vi.mock("@stores/userStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/userStore")>()),
   useThisUser: () => ({ user: { id: "1" } }),
}));

const wave: APISticker = {
   source: "klipy",
   id: "wave",
   title: "Wave",
   src: "https://cdn.example/wave.webp",
   url: "https://klipy.com/stickers/wave",
   width: 100,
   height: 100,
};
const custom: APISticker = { ...wave, source: "custom", id: "123", title: "My cat" };

function setup() {
   const onSelect = vi.fn();
   const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
   render(
      <QueryClientProvider client={queryClient}>
         <StickerPickerPanel onStickerSelect={onSelect} />
      </QueryClientProvider>,
   );
   return { onSelect };
}

function getUploadButton() {
   return screen.getByRole("tabpanel").querySelector("button")!;
}

async function confirmCrop(data = "data:image/gif;base64,R0lGODlh") {
   await waitFor(() =>
      expect(modals.updateModals).toHaveBeenCalledWith({
         imageCrop: expect.objectContaining({ isOpen: true, cropType: "sticker" }),
      }),
   );
   const crop = modals.updateModals.mock.calls.find(([modal]) => modal.imageCrop?.isOpen)![0].imageCrop;
   await act(async () => crop.callback(data));
}

beforeEach(() => {
   vi.clearAllMocks();
   fileDialog.openFileDialog.mockResolvedValue(null);
   vi.stubGlobal(
      "URL",
      class extends URL {
         static revokeObjectURL = fileDialog.revokeObjectURL;
      },
   );
   stickers.getTrending.mockResolvedValue([wave]);
   stickers.search.mockResolvedValue([wave]);
   stickers.getMine.mockResolvedValue([custom]);
   stickers.upload.mockResolvedValue(custom);
   stickers.delete.mockResolvedValue(undefined);
});

afterEach(() => vi.unstubAllGlobals());

describe("StickerPickerPanel", () => {
   it("browses Klipy stickers and sends the selected sticker reference", async () => {
      const { onSelect } = setup();
      fireEvent.click(screen.getByRole("tab", { name: "All Stickers" }));
      fireEvent.click(await screen.findByRole("button", { name: "Wave" }));
      expect(onSelect).toHaveBeenCalledWith(wave);
      expect(stickers.getTrending).toHaveBeenCalledWith(24, 1);
   });

   it("searches the selected tab and clears back to the complete library", async () => {
      setup();
      fireEvent.click(screen.getByRole("tab", { name: "Your Stickers" }));
      expect(await screen.findByRole("button", { name: "My cat" })).toBeInTheDocument();
      const search = screen.getByPlaceholderText("Search your stickers...");
      fireEvent.change(search, { target: { value: "cat" } });
      await waitFor(() => expect(stickers.getMine).toHaveBeenCalledWith("cat", 24, 1));
      expect(screen.getByRole("tab", { name: "Your Stickers" })).toHaveAttribute("aria-selected", "true");
      fireEvent.change(search, { target: { value: "" } });
      await waitFor(() => expect(screen.getByRole("button", { name: "My cat" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("tab", { name: "All Stickers" }));
      fireEvent.change(screen.getByPlaceholderText("Search in Klipy..."), { target: { value: "happy & cats" } });
      await waitFor(() => expect(stickers.search).toHaveBeenCalledWith("happy & cats", 24, 1));
   });

   it("places the upload tile in Your Stickers without footer text", async () => {
      setup();
      fireEvent.click(screen.getByRole("tab", { name: "Your Stickers" }));
      const tile = getUploadButton();
      expect(tile).toHaveClass("aspect-square");
      expect(screen.queryByText(/Powered by|Up to 10 MB/i)).not.toBeInTheDocument();
   });

   it("opens the crop modal and uploads only the confirmed GIF", async () => {
      setup();
      const file = new File(["gif"], "cat.gif", { type: "image/gif" });
      const data = new Uint8Array([71, 73, 70, 56, 57, 97]).buffer;
      fileDialog.openFileDialog.mockResolvedValueOnce({ file, dataUrl: "blob:sticker-upload", mimeType: file.type });
      fireEvent.click(screen.getByRole("tab", { name: "Your Stickers" }));
      fireEvent.click(getUploadButton());
      expect(stickers.upload).not.toHaveBeenCalled();
      await confirmCrop();
      expect(stickers.upload).toHaveBeenCalledWith({ data, name: "cat.gif", contentType: "image/gif" });
      expect(await screen.findByRole("button", { name: "My cat" })).toBeInTheDocument();
      expect(fileDialog.revokeObjectURL).not.toHaveBeenCalled();
      expect(document.querySelector('input[type="file"]')).toBeNull();
   });

   it("uploads cropped static images with their resulting format", async () => {
      setup();
      const file = new File(["jpeg"], "cat.jpg", { type: "image/jpeg" });
      fileDialog.openFileDialog.mockResolvedValueOnce({ file, dataUrl: "blob:sticker-upload", mimeType: file.type });
      fireEvent.click(getUploadButton());
      await confirmCrop("data:image/png;base64,AQID");
      expect(stickers.upload).toHaveBeenCalledWith({ data: new Uint8Array([1, 2, 3]).buffer, name: "cat.png", contentType: "image/png" });
   });

   it("rejects oversized uploads before making a request", async () => {
      setup();
      const file = new File(["test"], "large.gif", { type: "image/gif" });
      Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
      fileDialog.openFileDialog.mockResolvedValueOnce({ file, dataUrl: "blob:sticker-upload", mimeType: file.type });
      fireEvent.click(screen.getByRole("tab", { name: "Your Stickers" }));
      fireEvent.click(getUploadButton());
      await waitFor(() => expect(modals.showError).toHaveBeenCalledWith(expect.stringContaining("exceeds the maximum allowed size")));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText(/exceeds the maximum allowed size/)).not.toBeInTheDocument();
      expect(stickers.upload).not.toHaveBeenCalled();
   });

   it("shows provider errors in a modal and supports retrying there", async () => {
      stickers.getTrending.mockRejectedValueOnce(new Error("Unavailable"));
      setup();
      fireEvent.click(screen.getByRole("tab", { name: "All Stickers" }));
      await waitFor(() =>
         expect(modals.updateModals).toHaveBeenCalledWith({
            info: expect.objectContaining({ isOpen: true, status: "error", title: "Could not load stickers" }),
         }),
      );
      expect(screen.queryByText(/Could not load stickers/)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
      await act(async () => modals.updateModals.mock.calls[0][0].info.action.confirm.callback());
      expect(await screen.findByRole("button", { name: "Wave" })).toBeInTheDocument();
   });

   it("lets users delete their uploads", async () => {
      setup();
      fireEvent.click(screen.getByRole("tab", { name: "Your Stickers" }));
      const sticker = await screen.findByRole("button", { name: "My cat" });
      expect(screen.queryByRole("button", { name: "Delete My cat" })).not.toBeInTheDocument();
      fireEvent.contextMenu(sticker);
      expect(menu.open).toHaveBeenCalled();
      await menu.open.mock.calls[0][0].onDelete();
      await waitFor(() => expect(stickers.delete).toHaveBeenCalledWith("123"));
   });

   it("shows failed uploads in the error modal", async () => {
      stickers.upload.mockRejectedValueOnce(new Error("Upload failed"));
      setup();
      const file = new File(["gif"], "cat.gif", { type: "image/gif" });
      Object.defineProperty(file, "arrayBuffer", { value: async () => new ArrayBuffer(3) });
      fileDialog.openFileDialog.mockResolvedValueOnce({ file, dataUrl: "blob:sticker-upload", mimeType: file.type });
      fireEvent.click(screen.getByRole("tab", { name: "Your Stickers" }));
      fireEvent.click(getUploadButton());
      await confirmCrop();
      await waitFor(() => expect(modals.showError).toHaveBeenCalledWith("Could not upload this sticker. Try again."));
      expect(screen.queryByText("Could not upload this sticker. Try again.")).not.toBeInTheDocument();
   });

   it("shows failed deletions in the error modal", async () => {
      stickers.delete.mockRejectedValueOnce(new Error("Delete failed"));
      setup();
      fireEvent.click(screen.getByRole("tab", { name: "Your Stickers" }));
      fireEvent.contextMenu(await screen.findByRole("button", { name: "My cat" }));
      await act(async () => menu.open.mock.calls[0][0].onDelete());
      expect(modals.showError).toHaveBeenCalledWith("Could not delete this sticker. Try again.");
      expect(screen.queryByText("Could not delete this sticker. Try again.")).not.toBeInTheDocument();
   });
});
