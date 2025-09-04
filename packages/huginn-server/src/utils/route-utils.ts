import { type DBAttachment, type DBEmbed, getImageData, getVideoData, unauthorized, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import {
   type APIEmbed,
   type APIPostAttachmentJSONBody,
   CDNRoutes,
   type OAuthTokenPayload,
   type Snowflake,
   type UserTokenPayload,
   type Unpacked,
   isImageMediaType,
   isVideoMediaType,
} from "@huginn/shared";
import type { Endpoints } from "@octokit/types";
import { createMiddleware } from "hono/factory";
import { JSDOM } from "jsdom";
import markdownit from "markdown-it";
import { join } from "pathe";
import * as semver from "semver";
import { octokit } from "#setup";
import { envs } from "#setup";
import { cdnUpload } from "./server-request";

export function verifyJwt(identity?: boolean) {
   return createMiddleware(async (c, next) => {
      const bearer = c.req.header("Authorization");

      if (!bearer) {
         return unauthorized(c);
      }

      const token = bearer.split(" ")[1];

      const { valid, payload } = await verifyToken(token);

      if (!valid || !payload) {
         return unauthorized(c);
      }

      if (!identity && !(await prisma.user.exists({ id: BigInt((payload as UserTokenPayload).id) }))) {
         return unauthorized(c);
      }

      c.set("token", token);

      if (identity) {
         c.set("identityTokenPayload", payload as unknown as OAuthTokenPayload);
      } else {
         c.set("tokenPayload", payload as unknown as UserTokenPayload);
      }

      await next();
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
   const md = new markdownit({ linkify: true });
   const tokens = md.parse(input ?? "", {});
   const links: string[] = [];

   for (const token of tokens) {
      if (token.type === "inline" && token.children) {
         for (const childToken of token.children) {
            if (childToken.type === "link_open") {
               links.push(childToken.attrs?.[0]?.[1] ?? "");
            }
         }
      }
   }

   return links;
}

export async function extractData(url: string) {
   const response = await fetch(url, { headers: { "accept-language": "en" } });
   const contentType = response.headers.get("Content-Type");
   return { response, contentType };
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

export async function extractEmbedTags(response: Response): Promise<Record<string, string>> {
   try {
      // Fetch the HTML of the page
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
         metadata.url = response.url;
      }

      if (metadata.image && !metadata.image.startsWith("http")) {
         metadata.image = new URL(metadata.image, response.url).toString();
      }

      return metadata;
   } catch (error) {
      console.error("Error fetching embed info:", error);
      return {};
   }
}

export function getAttachmentUrl(url: string) {
   return url;
}

export async function generateEmbedsFromContent(content?: string) {
   const embeds: DBEmbed[] = [];
   const links = extractLinks(content);
   for (const link of links) {
      const { contentType, response } = await extractData(link);

      if (contentType && isImageMediaType(contentType)) {
         const thumbnailData = await getImageData(await response.arrayBuffer());
         embeds.push({
            type: "image",
            url: response.url,
            thumbnail: { width: thumbnailData?.width ?? 0, height: thumbnailData?.height ?? 0, url: response.url },
         });
         continue;
      }

      if (contentType && isVideoMediaType(contentType)) {
         const videoData = await getVideoData(join(envs.FFMPEG_TEMP_DIR, "output"), await response.arrayBuffer());
         embeds.push({
            type: "video",
            url: response.url,
            video: { width: videoData?.width ?? 0, height: videoData?.height ?? 0, url: response.url },
         });
         continue;
      }

      const metadata = await extractEmbedTags(response);
      const keys = Object.keys(metadata);

      // If we only have a url, don't do anything
      if (metadata.url && keys.length === 1) {
         return;
      }

      if (keys.length > 0) {
         // Fetch image data from embed
         let thumbnailData: { width: number; height: number } | undefined;
         if (metadata.image) {
            thumbnailData = await getImageData(metadata.image);
         }

         embeds.push({
            type: "rich",
            title: metadata.title,
            url: metadata.url,
            description: metadata.description,
            thumbnail: thumbnailData ? { url: metadata.image, width: thumbnailData.width ?? 0, height: thumbnailData.height ?? 0 } : undefined,
         });
      }
   }

   return embeds;
}

export async function processEmbeds(embeds?: APIEmbed[]) {
   // Fetch image data from embeds
   const processedEmbeds: DBEmbed[] = [];
   if (embeds) {
      for (const embed of embeds) {
         let thumbnailData: { width: number; height: number } | undefined;
         if (embed.thumbnail && (!embed.thumbnail.width || !embed.thumbnail.height)) {
            thumbnailData = await getImageData(embed.thumbnail.url);
         }

         processedEmbeds.push({
            title: embed.title,
            url: embed.url,
            description: embed.description,
            timestamp: embed.timestamp,
            type: embed.type,
            thumbnail: thumbnailData
               ? {
                  url: embed.thumbnail?.url ?? "",
                  width: embed.thumbnail?.width ?? thumbnailData.width ?? 0,
                  height: embed.thumbnail?.height ?? thumbnailData.height ?? 0,
               }
               : undefined,
         });
      }
   }

   return processedEmbeds;
}

export async function processAttachments(
   attachments: APIPostAttachmentJSONBody[] | undefined,
   files: Record<string, File>,
   channelId: Snowflake,
   messageId: Snowflake,
) {
   const processedAttachments: DBAttachment[] = [];
   if (attachments) {
      for (const attachment of attachments) {
         const file = files[`files[${attachment.id}]`];
         const fileArrayBuffer = await file.arrayBuffer();

         const name = (await cdnUpload(CDNRoutes.uploadAttachment(channelId, messageId), {
            files: [{ data: fileArrayBuffer, name: file.name, contentType: file.type }],
         })) as string;

         let dimensions: { width: number; height: number } | undefined;
         if (isImageMediaType(file.type)) {
            dimensions = await getImageData(fileArrayBuffer);
         }
         if (isVideoMediaType(file.type)) {
            dimensions = await getVideoData(join(envs.FFMPEG_TEMP_DIR, file.name), fileArrayBuffer);
         }

         processedAttachments.push({
            contentType: file.type,
            description: attachment.description,
            size: file.size,
            filename: file.name,
            flags: 0,
            width: dimensions?.width,
            height: dimensions?.height,
            url: `attachments/${channelId}/${messageId}/${name}`,
         });
      }
   }

   return processedAttachments;
}
