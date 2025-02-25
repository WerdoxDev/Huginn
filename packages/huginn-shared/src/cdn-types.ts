import type { constants } from "./constants";

export type ImageSize = (typeof constants.ALLOWED_IMAGE_SIZES)[number];
export type ImageFormats = (typeof constants.ALLOWED_IMAGE_FORMATS)[number];
export type VideoFormats = (typeof constants.ALLOWED_VIDEO_FORMATS)[number];

export type ImageURLOptions = {
	/**
	 * @default "webp"
	 */
	format?: ImageFormats;
	size?: ImageSize;
	forceStatic?: boolean;
};

export const fileTypes = {
	png: "image/png",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif",
	zip: "application/zip",
	other: "application/octet-stream",
	webm: "video/webm",
	mp4: "video/mp4",
	gifv: "audio/webm",
	wav: "audio/wav",
	mp3: "audio/mpeg",
	ogg: "audio/ogg",
} as const;

// eslint-disable-next-line @typescript-eslint/ban-types
export type FileFormats = keyof typeof fileTypes | (string & {});
export type FileContentTypes = (typeof fileTypes)[keyof typeof fileTypes];
