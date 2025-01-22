import { unauthorized } from "@huginn/backend-shared";
import type { IdentityTokenPayload, TokenPayload, Unpacked } from "@huginn/shared";
import type { Endpoints } from "@octokit/types";

import type { H3Event } from "h3";
import { JSDOM } from "jsdom";
import probe, { type ProbeResult } from "probe-image-size";
import * as semver from "semver";
import { prisma } from "#database";
import { octokit } from "#setup";
import { envs } from "#setup";
import { verifyToken } from "./token-factory";

export async function useVerifiedJwt<IdentityToken extends boolean = false>(event: H3Event, identity?: IdentityToken) {
	const bearer = getHeader(event, "Authorization");

	if (!bearer) {
		throw unauthorized(event);
	}

	const token = bearer.split(" ")[1];

	const { valid, payload } = await verifyToken(token);

	if (!valid || !payload) {
		throw unauthorized(event);
	}

	if (!identity && !(await prisma.user.exists({ id: BigInt((payload as TokenPayload).id) }))) {
		throw unauthorized(event);
	}

	return { payload: payload as IdentityToken extends true ? IdentityTokenPayload : TokenPayload, token };
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

export async function getImageData(url: string): Promise<ProbeResult | undefined> {
	try {
		return await probe(url);
	} catch (e) {
		console.error("Error fetching image data:", e);
		return undefined;
	}
}
