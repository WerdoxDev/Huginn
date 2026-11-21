import { hasFlag, MessageFlags } from ".";

/** Text for notifications and reply previews when an expression has no caption. */
export function getMessageSummary(message: { content: string; flags?: MessageFlags | null; gifs?: unknown; stickers?: unknown }): string {
   if (hasFlag(message.flags ?? 0, MessageFlags.VOICE_MESSAGE)) return "Voice message";
   if (message.content) return message.content;
   return [Array.isArray(message.gifs) && message.gifs.length ? "GIF" : "", Array.isArray(message.stickers) && message.stickers.length ? "Sticker" : ""]
      .filter(Boolean)
      .join(", ");
}
