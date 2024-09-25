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
