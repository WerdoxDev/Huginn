import type { RouteLike } from "./routes";

export type RequestMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type ResponseLike = {
	body: ReadableStream | null;
} & Pick<Response, "arrayBuffer" | "bodyUsed" | "headers" | "json" | "ok" | "status" | "statusText" | "text">;

export type RawFile = {
	/**
	 * Content-Type of the file
	 */
	contentType?: string;
	/**
	 * The actual data for the file
	 */
	data: ArrayBuffer | boolean | number | string;
	/**
	 * An explicit key to use for key of the formdata field for this file.
	 * When not provided, the index of the file in the files array is used in the form `files[${index}]`.
	 * If you wish to alter the placeholder snowflake, you must provide this property in the same form (`files[${placeholder}]`)
	 */
	key?: string;
	/**
	 * The name of the file
	 */
	name: string;
};

export type RequestData = {
	/**
	 * Whether to append JSON data to form data instead of `payload_json` when sending files
	 */
	appendToFormData?: boolean;

	/**
	 * If this request needs 'Authorization' header
	 */
	auth?: boolean;

	authPrefix?: "Bearer";

	/** A custom token if you don't want to use the client's token */
	token?: string;

	body?: BodyInit | unknown;

	/**
	 * Files to be attached to this request
	 */
	files?: RawFile[] | undefined;

	/**
	 * Additional headers for this request
	 */
	headers?: Record<string, string>;

	/**
	 * Query string parameters to append to the called endpoint
	 */
	query?: URLSearchParams;

	/**
	 * Use XMLHttpRequest to do the request. (Only useful for tracking upload progress)
	 */
	xhr?: {
		enabled: boolean;
		signal?: AbortSignal;
		onUploadProgress?: (event: ProgressEvent) => void;
	};
};

export type InternalRequest = {
	root: string;
	fullRoute: RouteLike;
	method: RequestMethod;
} & RequestData;

export type HandlerRequestData = Pick<InternalRequest, "auth" | "body" | "files">;

/**
 * Possible headers for an API call
 */
export type RequestHeaders = {
	Authorization?: string;
	"X-Log-Reason"?: string;
};

export type ResolvedRequest = {
	fetchOptions: RequestInit;
	url: string;
};

export type ResolvedFile = {
	data: ArrayBuffer;
	contentType?: string;
};
