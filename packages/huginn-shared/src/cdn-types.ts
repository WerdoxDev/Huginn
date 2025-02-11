import type { constants } from "./constants";

export type ImageSize = (typeof constants.ALLOWED_IMAGE_SIZES)[number];
export type ImageFormats = (typeof constants.ALLOWED_IMAGE_FORMATS)[number];

export type ImageURLOptions = {
	/**
	 * @default "webp"
	 */
	format?: ImageFormats;
	size?: ImageSize;
	forceStatic?: boolean;
};

export const FileTypes = {
	png: "image/png",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif",
	zip: "application/zip",
	other: "application/octet-stream",
} as const;

// eslint-disable-next-line @typescript-eslint/ban-types
export type FileFormats = keyof typeof FileTypes | (string & {});
export type FileContentTypes = (typeof FileTypes)[keyof typeof FileTypes];
