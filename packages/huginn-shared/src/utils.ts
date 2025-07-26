import type { MediaKind } from "mediasoup/node/lib/types";
import { sha256 } from "ohash";
import { fileTypes } from "./cdn-types";
import type { GatewayOperationTypes } from "./gateway-types";
import type { HMediaKind } from "./voice-types";

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

type BigIntToString<T> = T extends bigint
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
   const hash = sha256(new TextDecoder().decode(data)).substring(0, 32);
   return hash;
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
         oldUrl.pathname = oldUrl.pathname.replace(newBaseUrl.pathname, "");
         oldUrl.pathname = newBaseUrl.pathname.replace(/\/$/, "") + oldUrl.pathname; // Preserve newBase's path
         oldUrl = new URL(oldUrl.pathname, newBaseUrl);
      } catch {
         // If oldUrl is relative, ensure correct path joining
         const newUrl = url.replace(/^\/+/, ""); // Remove leading slashes
         newBaseUrl.pathname = `${newBaseUrl.pathname.replace(/\/$/, "")}/${newUrl}`; // Append correctly
         oldUrl = newBaseUrl;
      }

      return oldUrl.toString();
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

export function convertToMediaKind(hMediaKind: HMediaKind): MediaKind | undefined {
   switch (hMediaKind) {
      case "camera":
         return "video";
      case "microphone":
         return "audio";
      case "stream_audio":
         return "audio";
      case "stream_video":
         return "video";
   }
}

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

function levenshtein(a: string, b: string) {
   const dp = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
   );

   for (let i = 0; i <= a.length; i++) dp[i][0] = i;
   for (let j = 0; j <= b.length; j++) dp[0][j] = j;

   for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
         const cost = a[i - 1] === b[j - 1] ? 0 : 1;
         dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
         );
      }
   }

   return dp[a.length][b.length];
}

export function findClosestString(target: string, candidates: string[]): string {
   let closest = candidates[0];
   let minDistance = levenshtein(target, closest);

   for (let i = 1; i < candidates.length; i++) {
      const distance = levenshtein(target, candidates[i]);
      if (distance < minDistance) {
         minDistance = distance;
         closest = candidates[i];
      }
   }

   return closest;
}
