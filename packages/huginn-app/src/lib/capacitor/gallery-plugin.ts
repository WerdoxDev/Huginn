import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

// ─── Types ────────────────────────────────────────────────────────────────────

export enum MediaType {
   IMAGE = 1,
   VIDEO = 3,
}

export type GalleryMediaItem = {
   id: string;
   /** content:// URI on Android, file:// on iOS */
   uri: string;
   /** Absolute file path (may be empty on Android 10+ scoped storage) */
   filePath: string;
   name: string;
   // type: "photo" | "video";
   mimeType: string;
   /** Unix timestamp in seconds — also used as pagination cursor */
   createdAt: number;
   /** Duration in seconds (videos only) */
   duration: number;
   type: MediaType;
};

export type MediaOptions = {
   /** Max items to return. */
   limit: number;
   /**
    * Pagination cursor — pass the `cursor` value from the previous response.
    * Items older than this timestamp are returned.
    * Omit (or pass 0) for the first page.
    */
   after?: string;
   /** 'image' | 'video' | 'all'. Default: 'all' */
   types?: "image" | "video" | "all";
};

export type ThumbnailOptions = {
   id: string;
   uri: string;
   size: number;
   quality: number;
};

export type MediaResult = {
   media: GalleryMediaItem[];
   /** Pass this as `after` in the next call. 0 means no more pages. */
   cursor: number;
};

export type ThumbnailResult = {
   base64: string;
};

export enum GalleryErrorCode {
   DENIED_ONCE = "permission_denied_once",
   DENIED = "permission_denied",
}

export type MediaPermissionState = "granted" | "partial" | "denied_once" | "denied";

export type GalleryError = {
   error: GalleryErrorCode;
};

export type GalleryPlugin = {
   getMedia(options?: MediaOptions): Promise<MediaResult | GalleryError>;
   getMediaThumbnail: (options: ThumbnailOptions) => Promise<ThumbnailResult | GalleryError>;
   checkOrRequestPermission: (options?: {
      skipPartial: boolean;
   }) => Promise<{ status: MediaPermissionState; isPartial: boolean; settingsRequired?: boolean }>;
};

// ─── Registration ─────────────────────────────────────────────────────────────

export const Gallery = registerPlugin<GalleryPlugin>("Gallery", {
   // Web fallback — returns empty for browser builds
   web: () => ({
      getMedia: async () => ({ media: [], cursor: 0 }),
      getMediaThumbnail: async () => "",
   }),
});
