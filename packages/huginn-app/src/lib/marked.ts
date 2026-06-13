import { getEmojiFromSlug, getSlugsFromEmoji } from "@huginn/shared";
import emojiData from "emojibase-data/en/compact.json";
import emojiShortcodes from "emojibase-data/en/shortcodes/emojibase.json";
import { marked, type TokenizerExtension } from "marked";
// import emojis from "unicode-emoji-json/data-by-emoji.json";

const spoilerExtension: TokenizerExtension = {
   name: "spoiler",
   level: "inline",
   start(src) {
      return src.indexOf("||");
   },
   tokenizer(src) {
      const match = src.match(/^\|\|([^|]+)\|\|/);
      if (match) {
         const token = {
            type: "spoiler",
            raw: match[0],
            text: match[1],
            tokens: [],
         };
         this.lexer.inlineTokens(token.text, token.tokens);
         return token;
      }
   },
};

const underlineExtension: TokenizerExtension = {
   name: "underline",
   level: "inline",
   start(src) {
      return src.indexOf("__");
   },

   tokenizer(src) {
      const match = src.match(/^__([^_]+)__/);
      if (match) {
         const token = {
            type: "underline",
            raw: match[0],
            text: match[1],
            tokens: [],
         };
         this.lexer.inlineTokens(token.text, token.tokens);
         return token;
      }
   },
};

const EMOJI_PICTOGRAPHIC_RE =
   /(\p{Regional_Indicator}{2}|\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f)*/u;
const EMOJI_SLUG_RE = /^:([+\-a-zA-Z0-9_]+):/;
const EMOJI_PICTOGRAPHIC_ANCHORED_RE =
   /^(\p{Regional_Indicator}{2}|\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f)*/u;

const anchorEmojiCache = new Map<string, RegExpExecArray | null>();
const slugEmojiCache = new Map<string, RegExpExecArray | null>();

const emojiExtension: TokenizerExtension = {
   name: "emoji",
   level: "inline",
   start(src) {
      const colon = src.indexOf(":");
      const emojiIdx = src.search(EMOJI_PICTOGRAPHIC_RE);

      if (colon === -1) return emojiIdx;
      if (emojiIdx === -1) return colon;
      return Math.min(colon, emojiIdx);
   },
   tokenizer(src) {
      let slugMatch = slugEmojiCache.get(src);
      if (slugMatch === undefined) {
         slugMatch = EMOJI_SLUG_RE.exec(src);
         slugEmojiCache.set(src, slugMatch);
      }

      let emojiMatch = anchorEmojiCache.get(src);
      if (emojiMatch === undefined) {
         emojiMatch = EMOJI_PICTOGRAPHIC_ANCHORED_RE.exec(src);
         anchorEmojiCache.set(src, emojiMatch);
      }

      let emoji = emojiMatch?.[0];
      let slug = slugMatch?.[0];
      const raw = emoji ?? slug!;
      let initial = slug ? "slug" : "emoji";

      if (emoji && !slug) slug = getSlugsFromEmoji(emoji)?.[0];
      if (slug && !emoji) emoji = getEmojiFromSlug(slug);

      if (emoji && slug) {
         return {
            type: "emoji",
            slug: slug,
            emoji,
            initial,
            raw,
         };
      }
   },
};

const modifiedMarked = marked.use({ extensions: [spoilerExtension, underlineExtension, emojiExtension] });

export { modifiedMarked as marked };
