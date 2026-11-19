import { ExpressionType, MessageType, type APIExpression } from "@huginnjs/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AppMessage } from "@/types";

vi.mock("@components/editor/AttachmentElement", () => ({ default: () => null }));
vi.mock("@components/editor/CodeElement", () => ({ default: () => null }));
vi.mock("@components/editor/CodespanElement", () => ({ default: () => null }));
vi.mock("@components/editor/LinkElement", () => ({ default: () => null }));
vi.mock("@components/editor/ListElement", () => ({ default: () => null }));
vi.mock("@components/editor/ListItemElement", () => ({ default: () => null }));
vi.mock("@components/editor/MessageEmojiElement", () => ({ default: () => null }));
vi.mock("@components/editor/MessageLeaf", () => ({ default: () => null }));
vi.mock("@components/editor/MessageMentionElement", () => ({ default: () => null }));
vi.mock("@components/editor/ParagraphElement", () => ({ default: () => null }));
vi.mock("@components/editor/SpoilerElement", () => ({ default: () => null }));
vi.mock("@components/editor/EmbedElement", () => ({
   default: ({ media }: { media: APIExpression }) =>
      media.contentType.startsWith("video/") ? <video src={media.src} data-testid="media" /> : <img src={media.src} data-testid="media" />,
}));

import { useMessageRenderer } from "./useMessageRenderer";

function MessageContent({ message }: { message: AppMessage }) {
   const { children } = useMessageRenderer(message);
   return <>{children}</>;
}

describe("useMessageRenderer", () => {
   it.each([
      ["gifs", "image/gif"],
      ["gifs", "video/webm"],
      ["stickers", "image/webp"],
   ] as const)("preserves the %s %s element when the server acknowledges a preview", (kind, contentType) => {
      const media: APIExpression = {
         id: "123",
         type: ExpressionType.KLIPY,
         title: "Expression",
         url: "https://media.example/expression",
         src: "https://media.example/expression",
         width: 200,
         height: 200,
         contentType,
      };
      const preview: AppMessage = {
         id: "temporary-id",
         nonce: "stable-nonce",
         channelId: "channel",
         authorId: "author",
         timestamp: "2026-11-18T10:00:00.000Z",
         content: "",
         isPreview: true,
         [kind]: [media],
      };
      const confirmed: AppMessage = {
         id: "server-id",
         nonce: preview.nonce,
         channelId: preview.channelId,
         authorId: preview.authorId,
         timestamp: preview.timestamp,
         content: preview.content,
         isPreview: false,
         type: MessageType.DEFAULT,
         attachments: [],
         embeds: [{ type: kind === "gifs" ? "gif" : "sticker", media, url: media.url }],
         mentions: [],
         mentionEveryone: false,
         mentionOwner: false,
         editedTimestamp: null,
         pinned: false,
         flags: 0,
         source: "websocket",
      };
      const { rerender } = render(<MessageContent message={preview} />);
      const element = screen.getByTestId("media");

      rerender(<MessageContent message={confirmed} />);

      expect(screen.getByTestId("media")).toBe(element);
   });
});
