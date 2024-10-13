import { constants, type ImageFormats, type ImageURLOptions, type Snowflake } from "@huginn/shared";

export class CDN {
	private readonly cdn?: string;

	public constructor(cdn?: string) {
		this.cdn = cdn;
	}

	public avatar(id: Snowflake, hash: string, options?: Readonly<ImageURLOptions>): string {
		return this.dynamicMakeURL(`/avatars/${id}/${hash}`, hash, options);
	}

	public channelIcon(id: Snowflake, hash: string, options?: Readonly<ImageURLOptions>): string {
		return this.dynamicMakeURL(`/channel-icons/${id}/${hash}`, hash, options);
	}

	/**
	 * Constructs the URL for the resource, checking whether or not `hash` starts with `a_` if `dynamic` is set to `true`.
	 *
	 * @param route - The base cdn route
	 * @param hash - The hash provided by Discord for this icon
	 * @param options - Optional options for the link
	 */
	private dynamicMakeURL(route: string, hash: string, { forceStatic = false, ...options }: Readonly<ImageURLOptions> = {}): string {
		return this.makeURL(route, !forceStatic && hash.startsWith("a_") ? { ...options, format: "gif" } : options);
	}

	/**
	 * Constructs the URL for the resource
	 *
	 * @param route - The base cdn route
	 * @param options - The format/size options for the link
	 */
	private makeURL(route: string, { format = "webp", size }: Readonly<ImageURLOptions> = {}): string {
		format = String(format).toLowerCase() as ImageFormats;

		if (!constants.ALLOWED_IMAGE_FORMATS.includes(format)) {
			throw new RangeError(`Invalid format provided: ${format}\nMust be one of: ${constants.ALLOWED_IMAGE_FORMATS.join(", ")}`);
		}

		if (size && !constants.ALLOWED_IMAGE_SIZES.includes(size)) {
			throw new RangeError(`Invalid size provided: ${size}\nMust be one of: ${constants.ALLOWED_IMAGE_SIZES.join(", ")}`);
		}

		const url = new URL(`${this.cdn}${route}.${format}`);

		if (size) {
			url.searchParams.set("size", String(size));
		}

		return url.toString();
	}
}
