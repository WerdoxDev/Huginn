import emojiData from "./emojis.json";

export type EmojiInfo = {
   meta?: EmojiMapMeta;
   emojis: Emoji[];
};

export type Emoji = {
   codepoint: string;
   filename: string;
   position?: EmojiPosition;
   slugs: string[];
   unicode: string;
   group?: number;
   tone?: number | null;
};

export type EmojiPosition = {
   x: number;
   y: number;
   row: number;
   col: number;
};

export type EmojiMapMeta = {
   cellSize: number;
   padding: number;
   step: number;
   cols: number;
   rows: number;
   sheetWidth: number;
   sheetHeight: number;
   count: number;
};

export type NormalizedEmoji = { group?: number; slugs: string[]; unicode: string; codepoint: string; tone?: number };

const U200D = "\u200D"; // Zero-width joiner
const UFE0F = /\uFE0F/g; // Variation selector-16
export function getEmojiCodepoint(unicode: string): string {
   // Twemoji strips FE0F unless the sequence contains a ZWJ (U+200D).
   // ZWJ sequences use FE0F as part of the gender/presentation distinction
   // (e.g. 👨‍⚕️), so it must be preserved there.
   const normalized = unicode.indexOf(U200D) < 0 ? unicode.replace(UFE0F, "") : unicode;

   // Walk UTF-16 code units manually to handle surrogate pairs,
   // matching exactly how twemoji's toCodePoint works.
   const codePoints: string[] = [];
   let i = 0;
   while (i < normalized.length) {
      const c = normalized.charCodeAt(i++);
      if (c >= 0xd800 && c <= 0xdbff) {
         // High surrogate — pair it with the next low surrogate
         const next = normalized.charCodeAt(i++);
         codePoints.push((0x10000 + ((c - 0xd800) << 10) + (next - 0xdc00)).toString(16));
      } else {
         codePoints.push(c.toString(16));
      }
   }

   return codePoints.join("-");
}

const slugToUnicode = new Map<string, string>();
const unicodeToSlugs = new Map<string, string[]>();
const codepointToSlugs = new Map<string, string[]>();
console.log(getEmojiCodepoint("✅"));
// const unicodeToEmojiId = new Map<string, string>();
// const codepointToEmojiId = new Map<string, string>();
// const normalizedEmojis = new Map<string, NormalizedEmoji>();

for (const emoji of emojiData.emojis) {
   for (const slug of emoji.slugs) {
      slugToUnicode.set(slug, emoji.unicode);
   }
   codepointToSlugs.set(emoji.codepoint, emoji.slugs);
   unicodeToSlugs.set(emoji.unicode, emoji.slugs);
   // unicodeToEmojiId.set(emoji.unicode, emoji.id);
   // codepointToEmojiId.set(getEmojiCodepoint(emoji.unicode), emoji.id);
}

// // Pre-build slug maps from shortcodes, keyed by hexcode for O(1) lookup below
// const slugsByHexcode = new Map<string, string[]>();
// for (const [hexcode, slugs] of Object.entries(emojiShortcodes)) {
//    const slugArray = Array.isArray(slugs) ? slugs.map((s) => `:${s}:`) : [`:${slugs}:`];
//    slugsByHexcode.set(hexcode, slugArray);
// }

// for (const emojiInfo of emojiData) {
//    const group = emojiInfo.group;

//    // Register the base emoji
//    const baseSlugs = slugsByHexcode.get(emojiInfo.hexcode) ?? [];
//    hexcodeToEmoji.set(emojiInfo.hexcode, emojiInfo.unicode);
//    emojiToSlugs.set(emojiInfo.unicode, baseSlugs);
//    for (const slug of baseSlugs) slugToEmoji.set(slug, emojiInfo.unicode);
//    normalizedEmojis.set(emojiInfo.unicode, {
//       group,
//       slugs: baseSlugs,
//       emoji: emojiInfo.unicode,
//       hexcode: emojiInfo.hexcode,
//       skinTone: emojiInfo.skins ? 0 : null,
//    });

//    // Register skin tone variants
//    if (emojiInfo.skins) {
//       emojiInfo.skins.forEach((skin, i) => {
//          const skinSlugs = slugsByHexcode.get(skin.hexcode) ?? [];
//          hexcodeToEmoji.set(skin.hexcode, skin.unicode);
//          emojiToSlugs.set(skin.unicode, skinSlugs);
//          for (const slug of skinSlugs) slugToEmoji.set(slug, skin.unicode);
//          normalizedEmojis.set(skin.unicode, {
//             group,
//             slugs: skinSlugs,
//             emoji: skin.unicode,
//             hexcode: skin.hexcode,
//             skinTone: i + 1,
//          });
//       });
//    }
// }

export function getEmojiUnicodeFromSlug(slug: string): string | undefined {
   return slugToUnicode.get(slug);
}

export function getEmojiSlugsFromUnicode(unicode: string): string[] | undefined {
   return unicodeToSlugs.get(unicode);
}

export function getEmojiSlugsFromCodepoint(codepoint: string): string[] | undefined {
   return codepointToSlugs.get(codepoint);
}

export function getEmojiBySlug(slug: string): Emoji | undefined {
   const unicode = getEmojiUnicodeFromSlug(slug);
   if (!unicode) return undefined;
   return emojiData.emojis.find((e) => e.unicode === unicode);
}

export function getEmojiByCodepoint(codepoint: string): Emoji | undefined {
   return emojiData.emojis.find((e) => e.codepoint === codepoint);
}

// export function getEmojiIdFromUnicode(unicode: string): string | undefined {
//    return unicodeToEmojiId.get(unicode);
// }

// export function getEmojiIdFromCodepoint(codepoint: string): string | undefined {
//    return codepointToEmojiId.get(codepoint);
// }

// export function getEmojiById(id: string): Emoji | undefined {
//    return emojiData.emojis.find((e) => e.id === id);
// }

export function getAllEmojis(): Emoji[] {
   return emojiData.emojis;
}
