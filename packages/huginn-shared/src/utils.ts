import type { MediaKind } from "mediasoup/types";

// import emojis from "unicode-emoji-json/data-by-emoji.json" with { type: "json" };
import emojiData from "emojibase-data/en/compact.json" with { type: "json" };
import emojiShortcodes from "emojibase-data/en/shortcodes/emojibase.json" with { type: "json" };
import emojiMeta from "emojibase-data/meta/groups.json" with { type: "json" };
import { hash } from "ohash";

import type { GatewayOperationTypes } from "./gateway-types";
import type { HMediaKind } from "./voice-types";

import { fileTypes } from "./cdn-types";

export function pick<Data extends object, Keys extends keyof Data>(data: Data, keys: Keys[]): Pick<Data, Keys> {
   const result = {} as Pick<Data, Keys>;

   for (const key of keys) {
      result[key] = data[key];
   }

   return result;
}

export function omit<Obj extends object, Keys extends keyof Obj>(obj: Obj, keys: Keys[]): Omit<Obj, Keys> {
   const result = { ...obj };

   for (const key of keys) {
      delete result[key];
   }

   return result as Omit<Obj, Keys>;
}

export function omitArray<Obj extends object, Keys extends keyof Obj>(obj: Obj[], keys: Keys[]): Omit<Obj, (typeof keys)[number]>[] {
   const result = [];

   for (const copyObj of obj) {
      const modifiedObj = { ...copyObj };
      for (const key of keys) {
         delete modifiedObj[key];
      }

      result.push(modifiedObj);
   }

   return result;
}

// export function merge<A extends object[]>(...a: [...A]) {
//    return Object.assign({}, ...a) as Spread<A>;
// }

type DeepMerge<T, U> = {
   [K in keyof T | keyof U]: K extends keyof U
      ? U[K] extends object
         ? K extends keyof T
            ? T[K] extends object
               ? DeepMerge<T[K], U[K]>
               : U[K]
            : U[K]
         : U[K]
      : K extends keyof T
        ? T[K]
        : never;
};

function isObject(item: unknown): item is Record<string, unknown> {
   return item !== null && typeof item === "object" && !Array.isArray(item);
}

function deepMerge<T extends object, U extends object>(target: T, source: U): DeepMerge<T, U> {
   const output = { ...target } as DeepMerge<T, U>;

   if (isObject(target) && isObject(source)) {
      for (const key of Object.keys(source)) {
         const sourceKey = key as keyof U;
         const targetKey = key as keyof T;

         if (isObject(source[sourceKey])) {
            if (!(key in target)) {
               (output as Record<string, unknown>)[key] = source[sourceKey];
            } else {
               (output as Record<string, unknown>)[key] = deepMerge(target[targetKey] as unknown as object, source[sourceKey] as unknown as object);
            }
         } else {
            (output as Record<string, unknown>)[key] = source[sourceKey];
         }
      }
      // Object.keys(source).forEach((key) => {
      // });
   }

   return output;
}

export function merge<T extends object[]>(...objects: T): DeepMerge<T[0], T[1]> {
   return objects.reduce((acc, obj) => deepMerge(acc, obj), {}) as DeepMerge<T[0], T[1]>;
}

export type BigIntToString<T> = T extends bigint
   ? string
   : T extends Date
     ? Date
     : T extends (infer U)[]
       ? BigIntToString<U>[]
       : T extends object
         ? { [K in keyof T]: BigIntToString<T[K]> }
         : T;

export function idFix<T>(obj: T): BigIntToString<T> {
   if (Array.isArray(obj)) {
      return obj.map((item) => idFix(item)) as BigIntToString<T>;
   }
   if (obj instanceof Date) {
      return obj as unknown as BigIntToString<T>; // Do not convert Date objects
   }
   if (typeof obj === "object" && obj !== null) {
      const newObj: Record<string, unknown> = {};
      for (const key in obj) {
         if (typeof obj[key] === "bigint") {
            newObj[key] = (obj[key] as unknown as string).toString();
         } else if (typeof obj[key] === "object") {
            newObj[key] = idFix(obj[key]);
         } else {
            newObj[key] = obj[key];
         }
      }
      return newObj as BigIntToString<T>;
   }
   return obj as BigIntToString<T>;
}

export function isOpcode<O extends keyof GatewayOperationTypes>(data: unknown, opcode: O): data is GatewayOperationTypes[O] {
   if (data && typeof data === "object") {
      return "op" in data && data.op === opcode;
   }

   return false;
}

export function hasFlag<T extends number>(flags: T | undefined, flag: T): boolean {
   return ((flags || 0) & flag) === flag;
}

export function generateRandomString(n: number): string {
   if (n % 2 === 1) {
      throw new Error("Only even sizes are supported");
   }
   const buf = new Uint8Array(n / 2);
   crypto.getRandomValues(buf);
   let ret = "";
   for (let i = 0; i < buf.length; ++i) {
      ret += `0${buf[i].toString(16)}`.slice(-2);
   }
   return ret;
}

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Merge<A, B> = {
   // For shared properties with the same name but potentially different types, we take the union of their types.
   [K in keyof A & keyof B]: A[K] | B[K];
} & {
   // Unique properties in A (nullable or undefined)
   [K in Exclude<keyof A, keyof B>]?: A[K] | null;
} & {
   // Unique properties in B (nullable or undefined)
   [K in Exclude<keyof B, keyof A>]?: B[K] | null;
};

export function getFileHash(data: ArrayBuffer): string {
   const string = hash(data);
   return string;
}

export function compareArrayBuffers(...arrayBuffers: ReadonlyArray<ArrayBuffer>): boolean {
   const bufferCount = arrayBuffers.length;
   if (bufferCount < 2) return true;

   const { byteLength } = arrayBuffers[0];

   for (let i = 1; i < bufferCount; ++i) if (arrayBuffers[i].byteLength !== byteLength) return false;

   const dataViews = arrayBuffers.map((entry) => {
      if ("buffer" in entry && entry.buffer instanceof ArrayBuffer) return new DataView(entry.buffer);
      return new DataView(entry);
   });

   for (let i = 0; i < byteLength; i++) {
      const value = dataViews[0].getInt8(i);
      for (let j = 1; j < dataViews.length; j++) if (value !== dataViews[j].getInt8(i)) return false;
   }
   return true;
}

export function clamp(current: number, min: number, max: number): number {
   return Math.min(Math.max(current, min), max);
}

type NullToUndefined<T> = {
   [K in keyof T]: T[K] extends object | null ? NullToUndefined<Exclude<T[K], null>> : null extends T[K] ? Exclude<T[K], null> | undefined : T[K];
};

export function nullToUndefined<T>(obj: T): NullToUndefined<T> {
   if (Array.isArray(obj)) {
      return obj.map(nullToUndefined) as NullToUndefined<T>;
   }

   if (obj && typeof obj === "object") {
      return Object.fromEntries(
         Object.entries(obj)
            .filter(([_, value]) => value !== null) // Exclude `null` fields
            .map(([key, value]) => [key, nullToUndefined(value)]), // Recursively process nested objects
      ) as NullToUndefined<T>;
   }

   return obj as NullToUndefined<T>;
}

export function arrayEqual(a1: unknown[] | undefined, a2: unknown[] | undefined): boolean {
   return JSON.stringify(a1) === JSON.stringify(a2);
}

export function objectEqual(o1: unknown, o2: unknown): boolean {
   return JSON.stringify(o1) === JSON.stringify(o2);
}

export function isImageMediaType(type: string): boolean {
   if (type === fileTypes.gif || type === fileTypes.jpeg || type === fileTypes.jpg || type === fileTypes.png || type === fileTypes.webp) {
      return true;
   }

   return false;
}

export function isVideoMediaType(type: string): boolean {
   if (type === fileTypes.webm || type === fileTypes.mp4 || type === fileTypes.gifv) {
      return true;
   }

   return false;
}

export function isBrowser(): boolean {
   try {
      return globalThis === window;
      // oxlint-disable-next-line no-unused-vars
   } catch (e) {
      return false;
   }
}

export function constrainImageSize(width: number, height: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
   const aspectRatio = width / height;

   let newWidth = width;
   let newHeight = height;

   if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(newWidth / aspectRatio);
   }

   if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * aspectRatio);
   }

   return { width: newWidth, height: newHeight };
}

export function changeUrlBase(url: string, newBase: string): string {
   try {
      const newBaseUrl = new URL(newBase); // Ensure newBase is a valid URL
      let oldUrl: URL;

      try {
         oldUrl = new URL(url); // Check if oldUrl is absolute

         // Preserve the original search params, hash, etc.
         const searchParams = oldUrl.search;
         const hash = oldUrl.hash;

         // Handle the pathname
         oldUrl.pathname = oldUrl.pathname.replace(newBaseUrl.pathname, "");
         const newPathname = newBaseUrl.pathname.replace(/\/$/, "") + oldUrl.pathname;

         // Create new URL with preserved components
         const resultUrl = new URL(newPathname, newBaseUrl);
         resultUrl.search = searchParams; // Preserve search params
         resultUrl.hash = hash; // Preserve hash

         return resultUrl.toString();
      } catch {
         // If oldUrl is relative, parse it as a relative URL to extract components
         const tempUrl = new URL(url, "http://temp"); // Use temporary base to parse relative URL
         const searchParams = tempUrl.search;
         const hash = tempUrl.hash;

         // Handle the pathname part only
         const pathOnly = url.split("?")[0].split("#")[0]; // Get just the path part
         const newUrl = pathOnly.replace(/^\/+/, ""); // Remove leading slashes
         newBaseUrl.pathname = `${newBaseUrl.pathname.replace(/\/$/, "")}/${newUrl}`;

         // Restore search params and hash
         newBaseUrl.search = searchParams;
         newBaseUrl.hash = hash;

         return newBaseUrl.toString();
      }
   } catch (error) {
      console.error("Invalid URL:", error);
      return url;
   }
}

export function formatSeconds(seconds: number) {
   const minutes = Math.floor(seconds / 60);
   const remainingSeconds = seconds % 60;

   const formattedMinutes = String(minutes).padStart(2, "0");
   const formattedSeconds = String(Math.floor(remainingSeconds)).padStart(2, "0");

   return `${formattedMinutes}:${formattedSeconds}`;
}

export function validateGatewayData(data: unknown): boolean {
   if (data && typeof data === "object") {
      return "op" in data;
   }

   return false;
}

export function remap(value: number, fromMin: number, fromMax: number, toMin = 0, toMax = 100): number {
   return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
}

export function convertToMediaKind(hMediaKind: HMediaKind): MediaKind {
   switch (hMediaKind) {
      case "camera":
         return "video";
      case "microphone":
         return "audio";
      case "stream_audio":
         return "audio";
      case "stream_video":
         return "video";
      default:
         return "audio";
   }
}

export type DeepPartial<T> = T extends (...args: any[]) => any
   ? T
   : T extends Array<infer U>
     ? Array<DeepPartial<U>>
     : T extends ReadonlyArray<infer U>
       ? ReadonlyArray<DeepPartial<U>>
       : T extends object
         ? { [P in keyof T]?: DeepPartial<T[P]> }
         : T;

function levenshteinDistance(a: string, b: string): number {
   const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

   for (let i = 0; i <= a.length; i++) dp[i][0] = i;
   for (let j = 0; j <= b.length; j++) dp[0][j] = j;

   for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
         const cost = a[i - 1] === b[j - 1] ? 0 : 1;
         dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
   }

   return dp[a.length][b.length];
}

export function findClosestString(target: string, candidates: string[]): { match: string | null; similarity: number } {
   if (!candidates.length) return { match: null, similarity: 0 };

   let bestMatch = candidates[0];
   let bestSimilarity = calculateSimilarity(target, candidates[0]);

   for (let i = 1; i < candidates.length; i++) {
      const similarity = calculateSimilarity(target, candidates[i]);
      if (similarity > bestSimilarity) {
         bestSimilarity = similarity;
         bestMatch = candidates[i];
      }
   }

   return {
      match: bestMatch,
      similarity: bestSimilarity,
   };
}

export function calculateSimilarity(string1: string, string2: string): number {
   const maxLength = Math.max(string1.length, string2.length);
   if (maxLength === 0) return 100;

   const distance = levenshteinDistance(string1.toLowerCase(), string2.toLowerCase());
   return Math.round(((maxLength - distance) / maxLength) * 100);
}

/**
 * finds the properties that differ in both objects and only returns those properties from "a"
 * NOTE: only works with shallow objects. So no nested objects
 */
export function diff<T extends Record<string, any>>(a: T, b: T): Partial<T> {
   const result = {} as Partial<T>;
   for (const key in a) {
      if (a[key] !== b[key]) {
         result[key] = a[key];
      }
   }
   return result;
}

export function hexToRgb(hex: string): [number, number, number] {
   const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

export function rgbToHex(r: number, g: number, b: number): string {
   return (
      "#" +
      [r, g, b]
         .map((x) => {
            const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
         })
         .join("")
   );
}

export function interpolateColor(color1: string, color2: string, progress: number): string {
   const [r1, g1, b1] = hexToRgb(color1);
   const [r2, g2, b2] = hexToRgb(color2);
   const r = r1 + (r2 - r1) * progress;
   const g = g1 + (g2 - g1) * progress;
   const b = b1 + (b2 - b1) * progress;
   return rgbToHex(r, g, b);
}

const U200D = "\u200D"; // Zero-width joiner
const UFE0F = /\uFE0F/g; // Variation selector-16
export function getEmojiId(emoji: string): string {
   // Twemoji strips FE0F unless the sequence contains a ZWJ (U+200D).
   // ZWJ sequences use FE0F as part of the gender/presentation distinction
   // (e.g. 👨‍⚕️), so it must be preserved there.
   const normalized = emoji.indexOf(U200D) < 0 ? emoji.replace(UFE0F, "") : emoji;

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

export type NormalizedEmoji = { group: number; slugs: string[]; emoji: string; hexcode: string; skinTone: number | null };

const slugToEmoji = new Map<string, string>();
const emojiToSlugs = new Map<string, string[]>();
const hexcodeToEmoji = new Map<string, string>();
const normalizedEmojis = new Map<string, NormalizedEmoji>();

const emojiGroupCount = Object.keys(emojiMeta.groups).length;

const flatEmojiData = emojiData.reduce<typeof emojiData>((acc, emojiInfo) => {
   if (emojiInfo.skins) {
      acc.push(...emojiInfo.skins);
   }
   acc.push(emojiInfo);

   return acc;
}, []);

for (const [hexcode, slugs] of Object.entries(emojiShortcodes)) {
   const unicode = flatEmojiData.find((x) => x.hexcode === hexcode)?.unicode;
   if (!unicode) continue;

   const slugArray = Array.isArray(slugs) ? slugs.map((s) => `:${s}:`) : [`:${slugs}:`];
   emojiToSlugs.set(unicode, slugArray);
   for (const slug of slugArray) {
      slugToEmoji.set(slug, unicode);
   }
   hexcodeToEmoji.set(hexcode, unicode);
}

for (const emojiInfo of emojiData) {
   if (emojiInfo.skins) {
      for (let i = 0; i < emojiInfo.skins.length; i++) {
         const entry = emojiInfo.skins[i];
         const emoji = entry.unicode;
         const slugs = emojiToSlugs.get(emoji) || [];
         normalizedEmojis.set(emoji, {
            group: emojiInfo.group ?? emojiGroupCount,
            slugs: slugs,
            emoji: emoji,
            hexcode: entry.hexcode,
            skinTone: i + 1,
         });
      }
   }

   normalizedEmojis.set(emojiInfo.unicode, {
      group: emojiInfo.group ?? emojiGroupCount,
      slugs: emojiToSlugs.get(emojiInfo.unicode) || [],
      emoji: emojiInfo.unicode,
      hexcode: emojiInfo.hexcode,
      skinTone: emojiInfo.skins ? 0 : null,
   });
}

export function getEmojiFromSlug(slug: string): string | undefined {
   return slugToEmoji.get(slug);
}

export function getSlugsFromEmoji(emoji: string): string[] | undefined {
   return emojiToSlugs.get(emoji);
}

export function getEmojiFromHexcode(hexcode: string): NormalizedEmoji | undefined {
   const emoji = hexcodeToEmoji.get(hexcode);
   return emoji ? normalizedEmojis.get(emoji) : undefined;
}

export function getEmojis(): NormalizedEmoji[] {
   return Array.from(normalizedEmojis.values());
}
