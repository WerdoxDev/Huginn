import type { InfiniteData } from "@tanstack/react-query";

import { ChannelType, MessageType } from "@huginn/shared";
import { describe, expect, test } from "vitest";

import type { AppDirectChannel, AppMessage } from "@/types";

import { createTestChannel, createTestQueryClient, makeAppMessage } from "@/test-utils";

import { appendAppMessage, deleteAppMessage, updateAppMessage, updateChannelLastMessageId } from "./query-utils";
import { convertToAppDirectChannel } from "./utils";

describe("query-utils", () => {
   describe("updateChannelLastMessageId", () => {
      test("should update channel's last message id", () => {
         const client = createTestQueryClient();
         client.setQueryData<AppDirectChannel[]>(
            ["channels", "@me"],
            [
               convertToAppDirectChannel(createTestChannel({ type: ChannelType.DM, id: "123" })),
               convertToAppDirectChannel(createTestChannel({ type: ChannelType.GROUP_DM, id: "456" })),
               convertToAppDirectChannel(createTestChannel({ type: ChannelType.DM, id: "789" })),
            ],
         );

         updateChannelLastMessageId("123", "345", client);
         expect(client.getQueryData<AppDirectChannel[]>(["channels", "@me"])?.[0].lastMessageId).toBe("345");

         updateChannelLastMessageId("123", "123", client);
         expect(client.getQueryData<AppDirectChannel[]>(["channels", "@me"])?.[0].lastMessageId).toBe("345");

         updateChannelLastMessageId("123", "123", client, { allowLower: true });
         expect(client.getQueryData<AppDirectChannel[]>(["channels", "@me"])?.[0].lastMessageId).toBe("123");
      });
   });

   describe("appendAppMessage", () => {
      test("should append a new message to the target channel", () => {
         const client = createTestQueryClient();

         const channels = [
            convertToAppDirectChannel(createTestChannel({ type: ChannelType.DM, id: "123" })),
            convertToAppDirectChannel(createTestChannel({ type: ChannelType.DM, id: "345" })),
         ];

         client.setQueryData<AppDirectChannel[]>(["channels", "@me"], channels);

         client.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", "123"], {
            pages: [
               [makeAppMessage({ id: "1", channelId: "123" })],
               [makeAppMessage({ id: "2", channelId: "123" }), makeAppMessage({ id: "3", channelId: "123" })],
            ],
            pageParams: [{ before: "", after: "" }],
         });

         const newMessage = makeAppMessage({ id: "4", channelId: "123" });
         const result = appendAppMessage(client, "123", newMessage, channels[0], channels[0]);

         expect(result.inLoadedQueryPage).toBe(true);
         expect(client.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", "123"])?.pages[1][2]).toEqual(
            newMessage,
         );
      });
   });

   describe("updateAppMessage", () => {
      test("should replace the message in the messages cache when a full message is provided", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const original = makeAppMessage({ id: "1", channelId, pinned: false });
         client.setQueryData<InfiniteData<AppMessage[]>>(["messages", channelId], {
            pages: [[original]],
            pageParams: [{ before: "", after: "" }],
         });

         const updated = makeAppMessage({ id: "1", channelId, pinned: true });

         const result = updateAppMessage(client, { channelId, messageId: "1", message: updated });

         expect(result.inLoadedQueryPage).toBe(true);

         const data = client.getQueryData<InfiniteData<AppMessage[]>>(["messages", channelId]);
         expect(data?.pages[0][0]).toEqual(updated);
      });

      test("should replace the message in the messages cache when a full message is provided", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const original = makeAppMessage({ id: "1", channelId, pinned: false });
         client.setQueryData<InfiniteData<AppMessage[]>>(["messages", channelId], {
            pages: [[original]],
            pageParams: [{ before: "", after: "" }],
         });

         const updated = makeAppMessage({ id: "1", channelId, pinned: true });

         const result = updateAppMessage(client, { channelId, messageId: "1", message: updated });

         expect(result.inLoadedQueryPage).toBe(true);

         const data = client.getQueryData<InfiniteData<AppMessage[]>>(["messages", channelId]);
         expect(data?.pages[0][0]).toEqual(updated);
      });

      test("should merge a patch into the existing message", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const original = makeAppMessage({ id: "1", channelId, pinned: false });
         client.setQueryData<InfiniteData<AppMessage[]>>(["messages", channelId], {
            pages: [[original]],
            pageParams: [{ before: "", after: "" }],
         });

         const result = updateAppMessage(client, { channelId, messageId: "1", patch: { pinned: true } });

         expect(result.inLoadedQueryPage).toBe(true);

         const data = client.getQueryData<InfiniteData<AppMessage[]>>(["messages", channelId]);
         expect(data?.pages[0][0]).toEqual({ ...original, pinned: true });
      });

      test("should return inLoadedQueryPage: false when the message isn't in any loaded page", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const original = makeAppMessage({ id: "1", channelId });
         client.setQueryData<InfiniteData<AppMessage[]>>(["messages", channelId], {
            pages: [[original]],
            pageParams: [{ before: "", after: "" }],
         });

         const result = updateAppMessage(client, { channelId, messageId: "does-not-exist", patch: { pinned: true } });

         expect(result.inLoadedQueryPage).toBe(false);

         const data = client.getQueryData<InfiniteData<AppMessage[]>>(["messages", channelId]);
         expect(data?.pages[0][0]).toEqual(original);
      });

      test("should compute inVisibleQueryPage from targetChannel and currentChannel", () => {
         const client = createTestQueryClient();
         const channelA = convertToAppDirectChannel(createTestChannel({ type: ChannelType.DM, id: "1" }));
         const channelB = convertToAppDirectChannel(createTestChannel({ type: ChannelType.DM, id: "2" }));

         expect(
            updateAppMessage(client, {
               channelId: "1",
               messageId: "m1",
               patch: {},
               targetChannel: channelA,
               currentChannel: channelA,
            }).inVisibleQueryPage,
         ).toBe(true);

         expect(
            updateAppMessage(client, {
               channelId: "1",
               messageId: "m1",
               patch: {},
               targetChannel: channelA,
               currentChannel: channelB,
            }).inVisibleQueryPage,
         ).toBe(false);

         expect(updateAppMessage(client, { channelId: "1", messageId: "m1", patch: {} }).inVisibleQueryPage).toBe(true);
      });

      test("should add a message to pinned-messages when it becomes pinned and wasn't already pinned", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         client.setQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId], {
            pages: [[]],
            pageParams: [undefined],
         });

         const message = makeAppMessage({ id: "1", channelId, pinned: true });

         updateAppMessage(client, { channelId, messageId: "1", message });

         const data = client.getQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId]);

         expect(data?.pages[0]).toHaveLength(1);
         expect(data?.pages[0][0].message).toEqual(message);
      });

      test("should remove a message from pinned-messages when it becomes unpinned", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const pinnedMessage = makeAppMessage({ id: "1", channelId, pinned: true });

         client.setQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId], {
            pages: [[{ message: pinnedMessage, pinnedAt: "2024-01-01T00:00:00.000Z" }]],
            pageParams: [undefined],
         });

         const unpinnedMessage = makeAppMessage({ id: "1", channelId, pinned: false });

         updateAppMessage(client, { channelId, messageId: "1", message: unpinnedMessage });

         const data = client.getQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId]);

         expect(data?.pages[0]).toHaveLength(0);
      });

      test("should still update the message data inside an existing pin when using a patch", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const pinnedMessage = makeAppMessage({ id: "1", channelId, pinned: true });

         client.setQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId], {
            pages: [[{ message: pinnedMessage, pinnedAt: "2024-01-01T00:00:00.000Z" }]],
            pageParams: [undefined],
         });

         updateAppMessage(client, { channelId, messageId: "1", patch: { isPreview: true } });

         const data = client.getQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId]);

         // patch bails out before the pin add/remove logic, so the pin itself is untouched...
         expect(data?.pages[0]).toHaveLength(1);
         // ...but the message data inside it is still updated
         expect(data?.pages[0][0].message).toEqual({ ...pinnedMessage, isPreview: true });
      });

      test("should not add or remove pins for preview messages", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         client.setQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId], {
            pages: [[]],
            pageParams: [undefined],
         });

         const previewMessage = makeAppMessage({ id: "1", channelId, pinned: true, isPreview: true });

         updateAppMessage(client, { channelId, messageId: "1", message: previewMessage });

         const data = client.getQueryData<InfiniteData<Array<{ message: AppMessage; pinnedAt: string | Date }>>>(["pinned-messages", channelId]);

         expect(data?.pages[0]).toHaveLength(0);
      });

      test("should not throw when the pinned-messages cache has not been loaded yet", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const message = makeAppMessage({ id: "1", channelId, pinned: true });

         expect(() => updateAppMessage(client, { channelId, messageId: "1", message })).not.toThrow();
      });
   });

   describe("deleteAppMessage", () => {
      test("should remove the message from every page", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const msg1 = makeAppMessage({ id: "1", channelId });
         const msg2 = makeAppMessage({ id: "2", channelId });
         const msg3 = makeAppMessage({ id: "3", channelId });

         client.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId], {
            pages: [[msg1, msg2], [msg3]],
            pageParams: [
               { before: "", after: "" },
               { before: "", after: "" },
            ],
         });

         deleteAppMessage(client, channelId, "2");

         const data = client.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId]);

         expect(data?.pages[0]).toEqual([msg1]);
         expect(data?.pages[1]).toEqual([msg3]);
      });

      test("should clear referencedMessage on reply messages that referenced the deleted message", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const original = makeAppMessage({ id: "1", channelId });
         const reply = makeAppMessage({
            id: "2",
            channelId,
            type: MessageType.REPLY,
            referencedMessage: original,
            isPreview: false,
         });

         client.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId], {
            pages: [[original, reply]],
            pageParams: [{ before: "", after: "" }],
         });

         deleteAppMessage(client, channelId, "1");

         const data = client.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId]);

         expect(data?.pages[0]).toHaveLength(1);
         expect(data?.pages[0][0].id).toBe("2");
         expect((data?.pages?.[0]?.[0] as any)?.referencedMessage).toBeNull();
      });

      test("should leave referencedMessage intact on preview reply messages", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const original = makeAppMessage({ id: "1", channelId });
         const previewReply = makeAppMessage({
            id: "2",
            channelId,
            type: MessageType.REPLY,
            referencedMessage: original,
            isPreview: true,
         });

         client.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId], {
            pages: [[original, previewReply]],
            pageParams: [{ before: "", after: "" }],
         });

         deleteAppMessage(client, channelId, "1");

         const data = client.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId]);

         expect(data?.pages[0]).toHaveLength(1);
         expect((data?.pages?.[0]?.[0] as any)?.referencedMessage).toEqual(original);
      });

      test("should leave replies referencing a different message untouched", () => {
         const client = createTestQueryClient();
         const channelId = "123";

         const original = makeAppMessage({ id: "1", channelId });
         const unrelated = makeAppMessage({ id: "3", channelId });
         const reply = makeAppMessage({
            id: "2",
            channelId,
            type: MessageType.REPLY,
            referencedMessage: unrelated,
            isPreview: false,
         });

         client.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId], {
            pages: [[original, reply, unrelated]],
            pageParams: [{ before: "", after: "" }],
         });

         deleteAppMessage(client, channelId, "1");

         const data = client.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId]);

         expect((data?.pages?.[0]?.find((m) => m.id === "2") as any)?.referencedMessage).toEqual(unrelated);
      });

      test("should not throw when the messages cache has not been loaded yet", () => {
         const client = createTestQueryClient();

         expect(() => deleteAppMessage(client, "123", "1")).not.toThrow();
      });
   });
});
