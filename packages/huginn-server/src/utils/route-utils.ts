import type { Endpoints } from "@octokit/types";

import { type DBAttachment, type DBEmbed, getImageData, getVideoData } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { logger } from "@huginn/backend-shared/logger";
import {
   type APIBadge,
   type APIEmbed,
   type APIPostAttachmentJSONBody,
   BADGES,
   CDNRoutes,
   CacheStorage,
   FLAG_BADGE_MAP,
   type MarkedToken,
   type Snowflake,
   type Unpacked,
   UserFlags,
   analytics,
   hasFlag,
   isImageMediaType,
   isVideoMediaType,
   marked,
   organizeMarkedTokens,
   recordSpanError,
} from "@huginnjs/shared";
import { getMessaging } from "firebase-admin/messaging";
import { JSDOM } from "jsdom";
import * as semver from "semver";

import { octokit, resend } from "#server";
import { env } from "#setup";

import { fetchGifItems, filterGifs } from "./klipy";
import { cdnUpload } from "./server-request";

export function getWindowsAssetUrl(release?: Unpacked<Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"]>) {
   return release?.assets.find((x) => x.name.endsWith("setup.exe"))?.browser_download_url;
}

export function getAppPackageVersion(tagName: string) {
   return tagName.replace("app@", "");
}

const allReleasesCache = new CacheStorage<string, Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"]>(60 * 60); // Cache for 1 hour

export async function getAllAppReleases() {
   const releases = await allReleasesCache.cacheOrGet("releases", async () => {
      const fetchedReleases = (await octokit.rest.repos.listReleases({ owner: env.REPO_OWNER, repo: env.REPO })).data
         .filter((x) => x.tag_name.includes("app@"))
         .sort((v1, v2) => semver.rcompare(getAppPackageVersion(v1.tag_name), getAppPackageVersion(v2.tag_name)));
      return fetchedReleases;
   });
   return releases;
}

const tagsCache = new CacheStorage<string, Endpoints["GET /repos/{owner}/{repo}/tags"]["response"]["data"]>(60 * 60); // Cache for 1 hour

export async function getAllTags() {
   let page = 1;
   let allTags: Array<{ name: string }> = [];
   let hasNextPage = true;

   while (hasNextPage) {
      const response = await tagsCache.cacheOrGet(`page-${page}`, async () => {
         return (
            await octokit.rest.repos.listTags({
               owner: env.REPO_OWNER,
               repo: env.REPO,
               per_page: 100,
               page,
            })
         ).data;
      });

      allTags = allTags.concat(response);

      // Check if we received 100 tags—if so, there might be another page
      hasNextPage = response.length === 100;
      page++;
   }

   return allTags;
}

const releaseCache = new CacheStorage<string, Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]["data"]>(60 * 60); // Cache for 1 hour

export async function getReleaseByTag(tag: string) {
   const release = await releaseCache.cacheOrGet(tag, async () => {
      const response = await octokit.rest.repos.getReleaseByTag({
         owner: env.REPO_OWNER,
         repo: env.REPO,
         tag,
      });
      return response.data;
   });
   return release;
}

export function getMessageTokens(content: string): MarkedToken[] {
   const tokens = marked.lexer(content);
   const organizedTokens = organizeMarkedTokens(tokens);
   return organizedTokens;
}

// export function extractLinks(input?: string): string[] {
//    const md = new markdownit({ linkify: true });
//    const tokens = md.parse(input ?? "", {});
//    const links: string[] = [];

//    for (const token of tokens) {
//       if (token.type === "inline" && token.children) {
//          for (const childToken of token.children) {
//             if (childToken.type === "link_open") {
//                links.push(childToken.attrs?.[0]?.[1] ?? "");
//             }
//          }
//       }
//    }

//    return links;
// }

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
      logger.error(error, "fetching embed info failed");
      return {};
   }
}

export function getAttachmentUrl(url: string) {
   return url;
}

export async function generateEmbedsFromContent(tokens: MarkedToken[]) {
   const embeds: DBEmbed[] = [];
   const linkTokens = tokens.filter((token) => token.type === "link" && token.link?.href);

   for (const token of linkTokens) {
      // handle gifs from klipy.com
      if (token.link?.href.startsWith("https://klipy.com/gifs/")) {
         const slug = token.link.href.split("/").pop();
         const gif = filterGifs((await fetchGifItems([slug!])).data, { format: "webm", quality: "md" })[0];

         embeds.push({
            type: "gifv",
            title: gif.title,
            url: gif.url,
            video: { url: gif.src, width: gif.width, height: gif.height },

            // thumbnail: { url: gif.preview, width: gif.width, height: gif.height },
         });
         continue;
      }

      const { contentType, response } = await extractData(token.link!.href);

      if (contentType && isImageMediaType(contentType)) {
         const thumbnailData = await getImageData(await response.arrayBuffer());
         embeds.push({
            type: "image",
            url: response.url,
            thumbnail: {
               width: thumbnailData?.width ?? 0,
               height: thumbnailData?.height ?? 0,
               url: response.url,
            },
         });
         continue;
      }

      if (contentType && isVideoMediaType(contentType)) {
         const videoData = await getVideoData(await response.arrayBuffer());
         embeds.push({
            type: "video",
            url: response.url,
            video: {
               width: videoData?.width ?? 0,
               height: videoData?.height ?? 0,
               url: response.url,
            },
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
            thumbnail: thumbnailData
               ? {
                    url: metadata.image,
                    width: thumbnailData.width ?? 0,
                    height: thumbnailData.height ?? 0,
                 }
               : undefined,
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
   files: File[] | undefined | null,
   channelId: Snowflake,
   messageId: Snowflake,
) {
   const processedAttachments: DBAttachment[] = [];
   if (attachments && files) {
      for (const attachment of attachments) {
         const file = files[attachment.id];
         const fileArrayBuffer = await file.arrayBuffer();

         const name = (await cdnUpload(CDNRoutes.uploadAttachment(channelId, messageId), {
            files: [{ data: fileArrayBuffer, name: file.name, contentType: file.type }],
         })) as string;

         let dimensions: { width: number; height: number } | undefined;
         if (isImageMediaType(file.type)) {
            dimensions = await getImageData(fileArrayBuffer);
         }
         if (isVideoMediaType(file.type)) {
            dimensions = await getVideoData(fileArrayBuffer);
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

export async function processMentions(tokens: MarkedToken[]) {
   const userMentionTexts = tokens
      .filter((x) => x.type === "internal-mention" && x.internalMention?.type === "user")
      .map((x) => x.internalMention?.text)
      .filter((x): x is string => !!x);

   const existsFlags = await Promise.all(
      userMentionTexts.map(async (x) => {
         const exists = await prisma.user.exists({ id: BigInt(x) });
         console.log(`User mention ${x} exists: ${exists}`);
         return exists === true;
      }),
   );

   const userMentions = userMentionTexts.filter((_, i) => existsFlags[i]);

   const everyoneMentions = tokens
      .filter((x) => x.type === "internal-mention" && x.internalMention?.type === "everyone")
      .map((x) => x.internalMention?.text)
      .filter((x): x is string => !!x);

   const ownerMentions = tokens
      .filter((x) => x.type === "internal-mention" && x.internalMention?.type === "owner")
      .map((x) => x.internalMention?.text)
      .filter((x): x is string => !!x);

   return { userMentions, everyoneMentions, ownerMentions };
}

export function generateVerificationCode() {
   return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

export async function sendVerificationEmail(receiverEmail: string, code: string) {
   if (process.env.TEST) return;

   await resend.emails.send({
      to: receiverEmail,
      from: "Huginn <noreply@mail.huginn.dev>",
      subject: "Email Verification",
      template: { id: "email-verification", variables: { VERIFICATION_CODE: code } },
   });
}

export async function getUserBadges(userId: Snowflake): Promise<APIBadge[]> {
   const user = await prisma.user.getById(userId, { select: { flags: true } });
   const badges: APIBadge[] = [];

   for (const flag of Object.values(UserFlags)) {
      if (hasFlag(user.flags, flag as number)) {
         const flagBadgeType = FLAG_BADGE_MAP[flag as UserFlags];
         if (flagBadgeType) {
            badges.push(BADGES.find((x) => x.id === flagBadgeType)!);
         }
      }
   }

   return badges;
}

export async function sendPushNotification(
   userId: Snowflake,
   type: "add_message" | "ack_message",
   options: { data?: Record<string, unknown>; notificationChannelId?: string },
) {
   analytics.startActiveSpan("sendPushNotification", async (span) => {
      try {
         span.setAttributes({
            "params.user.id": userId,
         });

         const tokens = (await prisma.notificationToken.getByUserId(userId)).map((x) => x.token);
         span.setAttribute("tokens.count", tokens.length);

         logger.info(`sending push notification to user ${userId} with tokens ${tokens.join(", ")}`);

         if (tokens.length === 0) {
            logger.debug(`no tokens found for user ${userId}, skipping push notification`);
            span.setAttribute("skipped", true);
            return;
         }

         const data: Record<string, string> = {};
         for (const [key, value] of Object.entries({
            ...options.data,
            type,
            userId,
            // iconUrl: options.iconUrl,
            // imageUrl: options.imageUrl,
            notificationChannelId: options.notificationChannelId,
         })) {
            if (value != null) {
               data[key] = typeof value === "string" ? value : JSON.stringify(value);
            }
         }

         // Data-only Android messages are handled by MessagingService even when
         // the app is backgrounded, allowing the app to render the notification.
         const response = await getMessaging().sendEachForMulticast({
            tokens,
            android: { priority: "high" },
            data,
         });

         span.setAttribute("success_count", response.successCount);
         span.setAttribute("failure_count", response.failureCount);
      } catch (e) {
         recordSpanError(e);
      } finally {
         span.end();
      }
   });
}
