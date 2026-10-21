import type { APIPostChannelSearchJSONBody, APIPostChannelSearchResult } from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { ChannelType, MessageReferenceType, MessageType, snowflake, WorkerID } from "@huginnjs/shared";
import { beforeAll, describe, expect, test } from "bun:test";

import { authHeader, createTestChannel, createTestMessages, createTestUsers } from "#tests/utils";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeAll(async () => {
   users = await createTestUsers(3);
});

function search(body: APIPostChannelSearchJSONBody = {}, user = users[0]) {
   return testHandler("/api/channels/@me/search", authHeader(user.accessToken), "POST", body) as Promise<APIPostChannelSearchResult>;
}

async function fixture() {
   const channel = await createTestChannel(undefined, ChannelType.DM, users[0].id, users[1].id);
   return { channel, channelId: channel.id.toString() };
}

describe("POST /channels/@me/search", () => {
   test("requires authentication and rejects inaccessible or non-direct channels", async () => {
      const { channelId } = await fixture();
      const guild = await createTestChannel(undefined, ChannelType.GUILD_TEXT, users[0].id);

      await expect(testHandler("/api/channels/@me/search", {}, "POST", {})).rejects.toThrow("Unauthorized");
      await expect(search({ channelId }, users[2])).rejects.toThrow("Missing Access");
      await expect(search({ channelId: guild.id.toString() })).rejects.toThrow("Missing Access");
   });

   test("searches only accessible direct conversations, including owned groups", async () => {
      const { channel, channelId } = await fixture();
      const group = await createTestChannel(users[0].id, ChannelType.GROUP_DM, users[1].id);
      const privateChannel = await createTestChannel(undefined, ChannelType.DM, users[1].id, users[2].id);
      const guild = await createTestChannel(undefined, ChannelType.GUILD_TEXT, users[0].id);
      const content = `scope-${channelId}`;
      for (const channel of [group, privateChannel, guild]) {
         const [message] = await createTestMessages(channel.id, users[1].id, 1);
         await prisma.message.update({ where: { id: message.id }, data: { content } });
      }
      const [ownMessage] = await createTestMessages(channel.id, users[0].id, 1);
      await prisma.message.update({ where: { id: ownMessage.id }, data: { content } });

      const results = await search({ content });
      expect(results.map((message) => message.channelId).sort()).toEqual([channelId, group.id.toString()].sort());
      expect((await search({ channelId, content })).map((message) => message.id)).toEqual([ownMessage.id.toString()]);
   });

   test("defaults to 25 newest matches and paginates in either direction", async () => {
      const { channel, channelId } = await fixture();
      const messages = (await createTestMessages(channel.id, users[0].id, 30)).sort((a, b) => (a.id < b.id ? -1 : 1));
      const results = await search({ channelId });
      expect(results.map((message) => message.id)).toEqual(
         messages
            .slice(5)
            .reverse()
            .map((message) => message.id.toString()),
      );
      expect(results[0].author.id).toBe(users[0].id.toString());
      expect(results[0].mentions).toEqual([]);
      expect(results[0].attachments).toEqual([]);
      expect((await search({ channelId, sortOrder: "asc", offset: 3, limit: 2 })).map((message) => message.id)).toEqual(
         messages.slice(3, 5).map((message) => message.id.toString()),
      );
      expect((await search({ channelId, sortOrder: "desc", offset: 25 })).map((message) => message.id)).toEqual(
         messages
            .slice(0, 5)
            .reverse()
            .map((message) => message.id.toString()),
      );
      expect(await search({ channelId, offset: 100 })).toEqual([]);
   });

   test("combines content, author, all mentions, and pinned status", async () => {
      const { channel, channelId } = await fixture();
      const [match, missingMention, otherAuthor] = await createTestMessages(channel.id, users[0].id, 3);
      await prisma.message.update({
         where: { id: match.id },
         data: { content: "HELLO search", pinned: true, mentions: { connect: [{ id: users[0].id }, { id: users[1].id }] } },
      });
      await prisma.message.update({
         where: { id: missingMention.id },
         data: { content: "Hello search", pinned: true, mentions: { connect: [{ id: users[1].id }] } },
      });
      await prisma.message.update({ where: { id: otherAuthor.id }, data: { authorId: users[1].id, content: "hello search" } });
      const results = await search({
         channelId,
         content: "hello",
         authorId: users[0].id.toString(),
         pinned: true,
         mentions: [users[0].id.toString(), users[1].id.toString()],
      });
      expect(results.map((message) => message.id)).toEqual([match.id.toString()]);
      expect((await search({ channelId, pinned: false })).map((message) => message.id)).toEqual([otherAuthor.id.toString()]);
   });

   test("matches literal wildcard characters in content and attachment filenames", async () => {
      const { channel, channelId } = await fixture();
      const [match, other] = await createTestMessages(channel.id, users[0].id, 2);
      await prisma.message.update({ where: { id: match.id }, data: { content: "100%_complete\\file" } });
      await prisma.message.update({ where: { id: other.id }, data: { content: "100XXcompleteXfile" } });
      expect((await search({ channelId, content: "%_complete\\" })).map((message) => message.id)).toEqual([match.id.toString()]);
   });

   test("filters media, files, links, embeds, and matching attachment names/extensions", async () => {
      const { channel, channelId } = await fixture();
      const [image, video, audio, link, embeddedImage, splitAttachments] = await createTestMessages(channel.id, users[0].id, 6);
      const attachment = (messageId: bigint, filename: string, contentType: string) => ({
         id: snowflake.generate(WorkerID.ATTACHMENT),
         messageId,
         filename,
         contentType,
         size: 1,
         flags: 0,
         url: "https://example.com/attachment",
      });
      await prisma.attachment.createMany({
         data: [
            attachment(image.id, "holiday_100%.PNG", "image/png"),
            attachment(video.id, "movie.mp4", "video/mp4"),
            attachment(audio.id, "sound.ogg", "audio/ogg"),
            attachment(splitAttachments.id, "holiday_100%.txt", "text/plain"),
            attachment(splitAttachments.id, "other.png", "image/png"),
         ],
      });
      await prisma.message.update({ where: { id: link.id }, data: { content: "HTTPS://example.com/hello" } });
      await prisma.embed.create({
         data: { id: snowflake.generate(WorkerID.EMBED), messageId: embeddedImage.id, type: "image", url: "https://example.com/image" },
      });

      const ids = async (body: APIPostChannelSearchJSONBody) => (await search({ channelId, ...body })).map((message) => message.id).sort();
      expect(await ids({ has: ["image"] })).toEqual([image, embeddedImage, splitAttachments].map((message) => message.id.toString()).sort());
      expect(await ids({ has: ["video"] })).toEqual([video.id.toString()]);
      expect(await ids({ has: ["audio"] })).toEqual([audio.id.toString()]);
      expect(await ids({ has: ["file"] })).toEqual([image, video, audio, splitAttachments].map((message) => message.id.toString()).sort());
      expect(await ids({ has: ["link"] })).toEqual([link, embeddedImage].map((message) => message.id.toString()).sort());
      expect(await ids({ has: ["embed"], embedType: "IMAGE" })).toEqual([embeddedImage.id.toString()]);
      expect(await ids({ has: ["image", "file"], attachmentFilename: "HOLIDAY_100%", attachmentExtension: ".png" })).toEqual([image.id.toString()]);
      expect(await ids({ attachmentFilename: "HOLIDAY_100%", attachmentExtension: "png" })).toEqual([image.id.toString()]);
   });

   test("filters actual replies by referenced author and message, excluding pin notifications", async () => {
      const { channel, channelId } = await fixture();
      const [original] = await createTestMessages(channel.id, users[1].id, 1);
      const [reply, pinNotification] = await createTestMessages(channel.id, users[0].id, 2);
      for (const message of [reply, pinNotification]) {
         await prisma.message.update({
            where: { id: message.id },
            data: { type: message.id === reply.id ? MessageType.REPLY : MessageType.CHANNEL_PINNED_MESSAGE },
         });
         await prisma.messageReference.create({
            data: {
               id: snowflake.generate(WorkerID.MESSAGE_REFERENCE),
               referrerMessageId: message.id,
               messageId: original.id,
               channelId: channel.id,
               type: MessageReferenceType.DEFAULT,
            },
         });
      }
      expect((await search({ channelId, repliedToUserId: users[1].id.toString() })).map((message) => message.id)).toEqual([reply.id.toString()]);
      expect((await search({ channelId, repliedToMessageId: original.id.toString() })).map((message) => message.id)).toEqual([reply.id.toString()]);
      expect(await search({ channelId, repliedToMessageId: original.id.toString(), repliedToUserId: users[0].id.toString() })).toEqual([]);
   });

   test("uses synthetic timestamp bounds without requiring messages at those IDs", async () => {
      const { channel, channelId } = await fixture();
      const timestamp = Date.parse("2024-01-01T12:00:00.000Z");
      const ids = [
         BigInt(snowflake.getMinimum(timestamp - 1)),
         BigInt(snowflake.getMinimum(timestamp)),
         BigInt(snowflake.getMaximum(timestamp)),
         BigInt(snowflake.getMaximum(timestamp + 1)),
      ];
      for (const id of ids) {
         await prisma.message.create({
            data: {
               id,
               channelId: channel.id,
               authorId: users[0].id,
               content: "boundary",
               timestamp: new Date(snowflake.getTimestamp(id.toString())),
               type: MessageType.DEFAULT,
               pinned: false,
               flags: 0,
            },
         });
      }
      expect((await search({ channelId, minId: snowflake.getMinimum(timestamp) })).map((message) => message.id)).toEqual([ids[0].toString()]);
      expect((await search({ channelId, maxId: snowflake.getMaximum(timestamp) })).map((message) => message.id)).toEqual([ids[3].toString()]);
      expect(
         (await search({ channelId, minId: snowflake.getMinimum(timestamp + 1), maxId: snowflake.getMaximum(timestamp - 1), sortOrder: "asc" })).map(
            (message) => message.id,
         ),
      ).toEqual([ids[1].toString(), ids[2].toString()]);
   });

   test("rejects invalid pagination, filters, snowflakes, and database integer overflow", async () => {
      for (const body of [
         { limit: 26 },
         { limit: 0 },
         { limit: 1.5 },
         { offset: -1 },
         { offset: 0.5 },
         { offset: 2_147_483_648 },
         { sortOrder: "invalid" },
         { has: ["unknown"] },
         { minId: "not-an-id" },
         { maxId: "-1" },
         { channelId: "1.2" },
         { authorId: "9223372036854775808" },
         { mentions: ["9223372036854775808"] },
         { repliedToUserId: "1e5" },
         { repliedToMessageId: "" },
         { attachmentExtension: "." },
         { pinned: "true" },
      ]) {
         await expect(search(body as APIPostChannelSearchJSONBody)).rejects.toThrow("Invalid Form Body");
      }
   });
});
