import { ExpressionType, type APIExpression, type ExpressionKind } from "@huginnjs/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MediaPickerPanel from "./MediaPickerPanel";

const mocks = vi.hoisted(() => ({
   gifs: { getCategories: vi.fn(), getTrending: vi.fn(), search: vi.fn() },
   stickers: { getCategories: vi.fn(), getTrending: vi.fn(), search: vi.fn() },
}));

vi.mock("@hooks/useContainerWidth", () => ({ useContainerWidth: () => [undefined, 360] }));
vi.mock("@hooks/useFileDialog", () => ({ useFileDialog: () => ({ openFileDialog: vi.fn() }) }));
vi.mock("@hooks/useExpressions", () => ({
   useExpressions: () => ({ items: [media("Saved cat")], isLoading: false, isError: false, isPending: false }),
}));
vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => mocks,
   useClientStore: () => ({ urls: { cdn: "https://cdn.example" } }),
}));
vi.mock("@stores/userStore", () => ({ useThisUser: () => ({ user: { id: "1" } }) }));
vi.mock("@stores/contextMenuStore", () => ({ useContextMenu: () => ({ open: vi.fn() }) }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ showError: vi.fn() }) }));

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

function setup(kind: ExpressionKind, isOpen = true) {
   const onSelect = vi.fn();
   const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
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
      expect(screen.getByText(`Trending ${label}`)).toBeTruthy();
      expect(mocks[kind].getTrending).toHaveBeenCalledWith(24, 1);
      fireEvent.scroll(item.closest(".overflow-y-scroll")!);

      expect(await screen.findByRole("button", { name: "Next page" })).toBeTruthy();
      expect(mocks[kind].getTrending).toHaveBeenCalledWith(24, 2);
      expect(mocks[kind].search).not.toHaveBeenCalled();
   });

   it("supports typed searches from Trending and clears back to categories", async () => {
      setup(kind);
      fireEvent.click(screen.getByRole("tab", { name: `All ${label}` }));
      fireEvent.click(await screen.findByRole("button", { name: "Trending" }));
      await screen.findByRole("button", { name: "Trending result" });

      const input = screen.getByPlaceholderText("Search Klipy...");
      fireEvent.change(input, { target: { value: "cats" } });
      await waitFor(() => expect(mocks[kind].search).toHaveBeenCalledWith("cats", 24, 1));
      expect(await screen.findByRole("button", { name: "Search result" })).toBeTruthy();
      expect(screen.queryByText(`Trending ${label}`)).toBeNull();

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
