import { fileTypeFromBuffer } from "file-type";
import type { InternalRequest, RequestHeaders, ResolvedRequest, ResponseLike } from "./rest-types";

export function parseResponse(response: ResponseLike): Promise<unknown> {
	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		return response.json();
	}
	if (response.headers.get("Content-Type")?.startsWith("text/plain")) {
		return response.text();
	}
	if (response.headers.get("Content-Type")?.startsWith("text/html")) {
		return response.text();
	}

	return response.arrayBuffer();
}

/**
 * Format the request to use in a fetch
 *
 * @param request - The request data
 */
export async function resolveRequest(request: InternalRequest): Promise<ResolvedRequest> {
	let query = "";
	let finalBody: RequestInit["body"];
	let additionalHeaders: Record<string, string> = {};

	if (request.query) {
		query = `?${request.query}`;
	}

	// Required headers
	const headers: RequestHeaders = {};

	if (request.auth) {
		if (!request.token) {
			throw new Error(`Expected token for a request, but wasn't present ${request.fullRoute}`);
		}

		headers.Authorization = `${request.authPrefix} ${request.token}`;
	}

	if (request.reason?.length) {
		headers["X-Log-Reason"] = encodeURIComponent(request.reason);
	}

	const url = `${request.root}${request.fullRoute}${query}`;

	if (request.files?.length) {
		const formData = new FormData();

		for (const [index, file] of request.files.entries()) {
			const fileKey = file.key ?? `files[${index}]`;

			if (file.data instanceof ArrayBuffer) {
				let contentType = file.contentType;
				let name = file.name;

				const parsedType = await fileTypeFromBuffer(file.data);

				if (!contentType) {
					if (parsedType) {
						contentType = parsedType.mime ?? "application/octet-stream";
					}
				}

				if (!name.includes(".") && parsedType?.ext) {
					if (parsedType.mime === "image/gif") {
						name = `a_${name}.${parsedType.ext}`;
					} else {
						name = `${name}.${parsedType.ext}`;
					}
				}

				formData.append(fileKey, new Blob([file.data], { type: contentType }), name);
			} else {
				formData.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
			}
		}

		if (request.body) {
			if (request.appendToFormData) {
				for (const [key, value] of Object.entries(request.body)) {
					formData.append(key, value);
				}
			} else {
				formData.append("payload_json", JSON.stringify(request.body));
			}
		}

		finalBody = formData;
	} else if (request.body) {
		finalBody = JSON.stringify(request.body);
		additionalHeaders = { "Content-Type": "application/json" };
	}

	const method = request.method.toUpperCase();

	const fetchOptions: RequestInit = {
		// If for some reason we pass a body to a GET or HEAD request, remove the body
		body: ["GET", "HEAD"].includes(method) ? null : finalBody,
		headers: { ...request.headers, ...headers, ...additionalHeaders },
		method,
	};

	return { url, fetchOptions };
}
