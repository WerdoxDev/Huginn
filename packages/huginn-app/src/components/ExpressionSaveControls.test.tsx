import type { APIExpression } from "@huginnjs/shared";
import type { ReactNode } from "react";

import { ExpressionType } from "@huginnjs/shared";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ContextMenu from "./contextmenu/ContextMenu";
import { GifSaveContextMenuItem } from "./contextmenu/GifContextMenu";
import { StickerSaveContextMenuItem } from "./contextmenu/StickerContextMenu";
import ExpressionSaveButton from "./ExpressionSaveButton";

const mocks = vi.hoisted(() => ({
   find: vi.fn(),
   toggle: vi.fn(),
   useExpressions: vi.fn(),
}));

vi.mock("@hooks/useExpressions", () => ({ useExpressions: mocks.useExpressions }));
vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => false }));
vi.mock("@hooks/useErrorHandler", () => ({ useErrorHandler: () => vi.fn() }));
vi.mock("@hooks/useStackBackHandler", () => ({ useStackBackHandler: vi.fn() }));

const media = { attachmentId: "123", src: "https://media.example/cat.gif" };
const saved: APIExpression = {
   id: "imported",
   type: ExpressionType.UPLOADED,
   sourceKey: "attachment:123",
   title: "Cat",
   src: "https://cdn.example/cat.gif",
   url: "https://cdn.example/cat.gif",
   width: 100,
   height: 100,
   contentType: "image/gif",
};

function menu(children: ReactNode) {
   return <ContextMenu contextMenu={{ isOpen: true, position: [20, 30] }} renderChildren={children} />;
}

beforeEach(() => {
   vi.resetAllMocks();
   mocks.toggle.mockResolvedValue(undefined);
   mocks.useExpressions.mockImplementation(() => ({ find: mocks.find, toggle: mocks.toggle, isPending: false }));
});

describe.each([
   { name: "GIF save button", kind: "gifs", label: "GIFs", role: "button", control: () => <ExpressionSaveButton media={media} kind="gifs" /> },
   {
      name: "sticker save button",
      kind: "stickers",
      label: "Stickers",
      role: "button",
      control: () => <ExpressionSaveButton media={media} kind="stickers" />,
   },
   { name: "GIF context menu", kind: "gifs", label: "GIFs", role: "menuitem", control: () => menu(<GifSaveContextMenuItem gif={media} />) },
   {
      name: "sticker context menu",
      kind: "stickers",
      label: "Stickers",
      role: "menuitem",
      control: () => menu(<StickerSaveContextMenuItem sticker={media} />),
   },
])("$name", ({ kind, label, role, control }) => {
   it("delegates saving the original media and keeps save-button clicks from opening the media", async () => {
      const onMediaClick = vi.fn();
      render(<div onClick={onMediaClick}>{control()}</div>);

      fireEvent.click(screen.getByRole(role, { name: `Add to ${label}` }));

      await waitFor(() => expect(mocks.toggle).toHaveBeenCalledExactlyOnceWith(media));
      expect(mocks.useExpressions).toHaveBeenCalledWith(kind);
      expect(mocks.find).toHaveBeenCalledWith(media);
      if (role === "button") expect(onMediaClick).not.toHaveBeenCalled();
   });

   it("shows the removal action for saved media and disables pending controls", async () => {
      mocks.find.mockReturnValue(saved);
      const { rerender } = render(control());
      fireEvent.click(screen.getByRole(role, { name: `Remove from ${label}` }));
      await waitFor(() => expect(mocks.toggle).toHaveBeenCalledExactlyOnceWith(media));

      mocks.useExpressions.mockReturnValue({ find: mocks.find, toggle: mocks.toggle, isPending: true });
      rerender(control());
      const pending = screen.getByRole(role, { name: `Remove from ${label}` });
      expect(pending.hasAttribute("disabled") || pending.getAttribute("aria-disabled") === "true", pending.outerHTML).toBe(true);
      fireEvent.click(pending);
      expect(mocks.toggle).toHaveBeenCalledTimes(1);
   });

   it("handles a rejected save and allows another activation to succeed", async () => {
      const failed = Promise.withResolvers<void>();
      mocks.toggle.mockReturnValueOnce(failed.promise);
      render(control());
      const action = screen.getByRole(role, { name: `Add to ${label}` });
      fireEvent.click(action);

      await act(async () => failed.reject(new Error("Save failed")));
      fireEvent.click(action);

      await waitFor(() => expect(mocks.toggle).toHaveBeenCalledTimes(2));
      expect(mocks.toggle).toHaveBeenLastCalledWith(media);
   });
});
