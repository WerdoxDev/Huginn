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
      return src.indexOf(":");
   },
   tokenizer(src) {
      const match = src.match(/^:([a-zA-Z0-9_]+):/);
      const unicodeEmojiMatch = src.match(
         /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f)*/u,
      );
      if (match || unicodeEmojiMatch) {
         const emojiId = [...(match ? match[0] : unicodeEmojiMatch![0]).replace(/[\uFE00-\uFE0F]/g, "")]
            .map((x) => x.codePointAt(0)?.toString(16))
            .join("-");
         return {
            type: "emoji",
            raw: match ? match[0] : unicodeEmojiMatch![0],
            id: emojiId,
            text: match ? match[1] : unicodeEmojiMatch![0],
         };
      }
   },
};

const modifiedMarked = marked.use({ extensions: [spoilerExtension, underlineExtension, emojiExtension] });

export { modifiedMarked as marked };
