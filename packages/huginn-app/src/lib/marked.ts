import { marked, type TokenizerExtension } from "marked";

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
      const match = src.match(/^:([a-zA-Z0-9_]+):/);
      const unicodeEmojiMatch = src.match(
         /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f)*/u,
      );
      if (match || unicodeEmojiMatch) {
         return {
            type: "emoji",
            slug: match ? match[1] : undefined,
            emoji: unicodeEmojiMatch ? unicodeEmojiMatch[0] : undefined,
            raw: match ? match[0] : unicodeEmojiMatch![0],
         };
      }
   },
};

const modifiedMarked = marked.use({ extensions: [spoilerExtension, underlineExtension, emojiExtension] });

export { modifiedMarked as marked };
