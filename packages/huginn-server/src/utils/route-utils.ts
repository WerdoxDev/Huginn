import { unauthorized } from "@huginn/backend-shared";
import { type IdentityTokenPayload, type TokenPayload, type Unpacked, constrainImageSize } from "@huginn/shared";
import type { Endpoints } from "@octokit/types";
import { createMiddleware } from "hono/factory";
import { JSDOM } from "jsdom";
import * as semver from "semver";
import sharp from "sharp";
import { prisma } from "#database";
import { octokit } from "#setup";
import { envs } from "#setup";
import { verifyToken } from "./token-factory";

export function verifyJwt(identity?: boolean) {
	return createMiddleware(async (c, next) => {
		//TODO: THIS IS TO FIX A VERY WEIRD BUG IN HONO
		// await c.req.blob();

		const bearer = c.req.header("Authorization");

		if (!bearer) {
			return unauthorized(c);
		}

		const token = bearer.split(" ")[1];

		const { valid, payload } = await verifyToken(token);

		if (!valid || !payload) {
			return unauthorized(c);
		}

		if (!identity && !(await prisma.user.exists({ id: BigInt((payload as TokenPayload).id) }))) {
			return unauthorized(c);
		}

		c.set("token", token);

		if (identity) {
			c.set("identityTokenPayload", payload as unknown as IdentityTokenPayload);
		} else {
			c.set("tokenPayload", payload as unknown as TokenPayload);
		}

		await next();
		// return { payload: payload as IdentityToken extends true ? IdentityTokenPayload : TokenPayload, token };
	});
}

export function getWindowsAssetUrl(release?: Unpacked<Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"]>) {
	return release?.assets.find((x) => x.name.endsWith("setup.exe"))?.browser_download_url;
}

export function getAppPackageVersion(tagName: string) {
	return tagName.replace("app@", "");
}

export async function getAllAppReleases() {
	const releases = (await octokit.rest.repos.listReleases({ owner: envs.REPO_OWNER, repo: envs.REPO })).data
		.filter((x) => x.tag_name.includes("app@"))
		.sort((v1, v2) => semver.rcompare(getAppPackageVersion(v1.tag_name), getAppPackageVersion(v2.tag_name)));
	return releases;
}

export async function getAllTags() {
	let page = 1;
	let allTags: Array<{ name: string }> = [];
	let hasNextPage = true;

	while (hasNextPage) {
		const response = await octokit.rest.repos.listTags({
			owner: envs.REPO_OWNER,
			repo: envs.REPO,
			per_page: 100,
			page,
		});

		allTags = allTags.concat(response.data);

		// Check if we received 100 tags—if so, there might be another page
		hasNextPage = response.data.length === 100;
		page++;
	}

	return allTags;
}

export function extractLinks(input?: string): string[] {
	const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
	return input?.match(urlRegex) || [];
}

const metaTagsMap = {
	description: "description",
	title: "title",
	"og:url": "url",
	"og:description": "description",
	"og:title": "title",
	"og:image": "image",
	"twitter:url": "url",
	"twitter:description": "description",
	"twitter:title": "title",
	"twitter:image": "image",
};

export async function extractEmbedTags(url: string): Promise<Record<string, string>> {
	try {
		// Fetch the HTML of the page
		const response = await fetch(url, { headers: { "accept-language": "en" } });
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const html = await response.text();

		// Parse the HTML
		const dom = new JSDOM(html);
		const metaTags = dom.window.document.querySelectorAll("meta");

		const metadata: Record<string, string> = {};

		for (const tag of metaTags) {
			if (!tag) {
				continue;
			}

			const tagName = tag.getAttribute("name") ?? tag.getAttribute("property");
			const tagValue = tag.getAttribute("content");
			if (!tagName || !tagValue || !Object.keys(metaTagsMap).includes(tagName)) {
				continue;
			}

			const foundKey = Object.keys(metaTagsMap).find((x) => x === tagName);
			if (!foundKey) {
				continue;
			}

			const tagEmbedName = metaTagsMap[foundKey as keyof typeof metaTagsMap];

			metadata[tagEmbedName] = tagValue;
		}

		if (!metadata.title) {
			const title = dom.window.document.querySelector("title");
			if (title?.text) {
				metadata.title = title.text;
			}
		}

		if (!metadata.url) {
			metadata.url = url;
		}

		if (metadata.image && !metadata.image.startsWith("http")) {
			metadata.image = new URL(metadata.image, url).toString();
		}

		return metadata;
	} catch (error) {
		console.error("Error fetching embed info:", error);
		return {};
	}
}

export async function getImageData(source: string | ArrayBuffer) {
	try {
		let arrayBuffer: ArrayBuffer;
		if (typeof source === "string") {
			arrayBuffer = await (await fetch(source)).arrayBuffer();
		} else {
			arrayBuffer = source;
		}

		const metadata = await sharp(arrayBuffer).metadata();
		// const newDimensions = constrainImageSize(metadata.width ?? 0, metadata.height ?? 0, maxWidth, maxHeight, true);

		return { width: metadata.width ?? 0, height: metadata.height ?? 0 };
	} catch (e) {
		console.error("Error fetching image data:", e);
		return undefined;
	}
}

export function getAttachmentUrl(url: string) {
	try {
		const cdnBase = new URL(envs.CDN_PUBLIC_URL ?? ""); // Ensure newBase is a valid URL

		let old: URL;
		try {
			old = new URL(url); // Check if oldUrl is absolute
			old.pathname = old.pathname.replace(cdnBase.pathname, "");
			old.pathname = cdnBase.pathname.replace(/\/$/, "") + old.pathname; // Preserve newBase's path
			old = new URL(old.pathname, cdnBase);
		} catch {
			// If oldUrl is relative, ensure correct path joining
			const newUrl = url.replace(/^\/+/, ""); // Remove leading slashes
			cdnBase.pathname = `${cdnBase.pathname.replace(/\/$/, "")}/${newUrl}`; // Append correctly
			old = cdnBase;
		}

		return old.toString();
	} catch (error) {
		console.error("Invalid URL:", error);
		return url;
	}
}
