/** Text for notifications and reply previews when an expression has no caption. */
export function getMessageSummary(message: { content: string; gifs?: unknown; stickers?: unknown }): string {
   if (message.content) return message.content;
   return [Array.isArray(message.gifs) && message.gifs.length ? "GIF" : "", Array.isArray(message.stickers) && message.stickers.length ? "Sticker" : ""]
      .filter(Boolean)
      .join(", ");
}
