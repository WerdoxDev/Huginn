import type { APISticker } from "@huginnjs/shared";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StickerElement from "./StickerElement";

vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClientStore: () => ({ urls: { cdn: "https://instance.example/cdn" } }),
}));

const sticker: APISticker = {
   source: "custom",
   id: "123",
   title: "Wave",
   src: "stickers/123.webp",
   url: "stickers/123.webp",
   width: 512,
   height: 256,
};

describe("StickerElement", () => {
   it("renders custom stickers from the current instance CDN", () => {
      render(<StickerElement sticker={sticker} />);
      const image = screen.getByRole("img", { name: "Wave" }) as HTMLImageElement;
      expect(image.src).toBe("https://instance.example/cdn/stickers/123.webp");
      expect(image.width).toBe(160);
      expect(image.height).toBe(80);
   });

   it("renders Klipy stickers through the external media proxy", () => {
      render(<StickerElement sticker={{ ...sticker, source: "klipy", id: "wave", src: "https://static.klipy.com/wave.webp" }} />);
      const image = screen.getByRole("img", { name: "Wave" }) as HTMLImageElement;
      expect(decodeURIComponent(image.src)).toBe("https://instance.example/cdn/external/https://static.klipy.com/wave.webp");
   });
});
