import { getEmojiFromSlug, getSlugsFromEmoji } from "@huginn/shared";
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

const emojiExtension: TokenizerExtension = {
   name: "emoji",
   level: "inline",
   start(src) {
      const emojiStartRegex =
         /(\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f)*/u;
      const colon = src.indexOf(":");
      const emoji = src.search(emojiStartRegex);

      if (colon === -1) return emoji;
      if (emoji === -1) return colon;

      return Math.min(colon, emoji);
   },
   tokenizer(src) {
      const slugMatch = src.match(/^:([a-zA-Z0-9_]+):/);
      const emojiMatch = src.match(
         /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f)*/u,
      );
      // if (slugMatch) {
      //    if (!Object.values(emojis).some((x) => x.slug === slugMatch[1])) {
      //       return;
      //    }
      // }

      let emoji = emojiMatch?.[0];
      let slug = slugMatch?.[1];
      const raw = emoji ?? `:${slug}:`;
      let initial = slug ? "slug" : "emoji";

      if (emoji && !slug) slug = getSlugsFromEmoji(emoji)?.[0];
      if (slug && !emoji) emoji = getEmojiFromSlug(slug);

      if (emoji && slug) {
         return {
            type: "emoji",
            slug: `:${slug}:`,
            emoji,
            initial,
            raw,
         };
      }
   },
};

const modifiedMarked = marked.use({ extensions: [spoilerExtension, underlineExtension, emojiExtension] });

export { modifiedMarked as marked };
