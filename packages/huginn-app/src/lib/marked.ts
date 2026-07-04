import { getEmojiCodepoint, getEmojiSlugsFromCodepoint, getEmojiUnicodeFromSlug } from "@huginn/shared";
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

const UNICODE_PICTOGRAPHIC_RE =
   /(\p{Regional_Indicator}{2}|\p{Extended_Pictographic}|\p{Emoji_Presentation}|[*#0-9]\ufe0f\u20e3|[*#0-9]\u20e3)(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f|[\u{e0020}-\u{e007e}]+\u{e007f})*/u;
const UNICODE_SLUG_RE = /^:([+\-a-zA-Z0-9_]+):/;
const UNICODE_PICTOGRAPHIC_ANCHORED_RE =
   /^(\p{Regional_Indicator}{2}|\p{Extended_Pictographic}|\p{Emoji_Presentation}|[*#0-9]\ufe0f\u20e3|[*#0-9]\u20e3)(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f|[\u{e0020}-\u{e007e}]+\u{e007f})*/u;

const anchorEmojiCache = new Map<string, RegExpExecArray | null>();
const slugEmojiCache = new Map<string, RegExpExecArray | null>();

const emojiExtension: TokenizerExtension = {
   name: "emoji",
   level: "inline",
   start(src) {
      const colon = src.indexOf(":");
      const unicodeIdx = src.search(UNICODE_PICTOGRAPHIC_RE);

      if (colon === -1) return unicodeIdx;
      if (unicodeIdx === -1) return colon;
      return Math.min(colon, unicodeIdx);
   },
   tokenizer(src) {
      let slugMatch = slugEmojiCache.get(src);
      if (slugMatch === undefined) {
         slugMatch = UNICODE_SLUG_RE.exec(src);
         slugEmojiCache.set(src, slugMatch);
      }

      let unicodeMatch = anchorEmojiCache.get(src);
      if (unicodeMatch === undefined) {
         unicodeMatch = UNICODE_PICTOGRAPHIC_ANCHORED_RE.exec(src);
         anchorEmojiCache.set(src, unicodeMatch);
      }

      let unicode = unicodeMatch?.[0];
      let slug = slugMatch?.[0];
      const raw = unicode ?? slug!;
      const codepoint = unicode ? getEmojiCodepoint(unicode) : undefined;

      if (unicode && codepoint && !slug) slug = getEmojiSlugsFromCodepoint(codepoint)?.[0];
      if (slug && !unicode) unicode = getEmojiUnicodeFromSlug(slug);

      if (unicode && slug) {
         // TODO: Id is to be used later for custom emojis
         return { type: "emoji", id: undefined, slug, unicode, raw };
      }
   },
};

const userIdMentionExtension: TokenizerExtension = {
   name: "user-id-mention",
   level: "inline",
   start(src: string) {
      return src.match(/<@/)?.index;
   },
   tokenizer(src: string) {
      const match = /^<@(\d*)>/.exec(src);
      if (match) {
         return { type: "user-id-mention", raw: match[0], text: match[1] };
      }
   },
};

const userEveryoneMentionExtension: TokenizerExtension = {
   name: "user-everyone-mention",
   level: "inline",
   start(src) {
      return src.match(/@(everyone|all|leader)\b/i)?.index;
   },
   tokenizer(src) {
      const match = /^@(everyone|all|leader)\b/i.exec(src);
      if (match) {
         return { type: "user-everyone-mention", raw: match[0], text: match[1] };
      }
   },
};

const userMentionExtension: TokenizerExtension = {
   name: "user-mention",
   level: "inline",
   start(src) {
      return src.indexOf("@");
   },
   tokenizer(src, tokens) {
      if (src.startsWith("<@") || tokens.at(-1)?.raw.endsWith("<")) return;
      const match = /^@([a-zA-Z0-9_]*)/.exec(src);
      if (match) {
         return {
            type: "user-mention",
            raw: match[0],
            text: match[1],
            queryIndex: 1, // the index at which the cursor must be placed to start the query for autocomplete. 1 means after the @ symbol.
         };
      }
   },
};

const modifiedMarked = marked.use({
   tokenizer: {
      html: () => {},
      tag: () => {},
   },
   extensions: [spoilerExtension, underlineExtension, emojiExtension, userMentionExtension, userEveryoneMentionExtension, userIdMentionExtension],
});

export { modifiedMarked as marked };
