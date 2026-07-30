import { HuginnClient } from "@huginnjs/api";
import {
   ChannelType,
   MessageReferenceType,
   MessageType,
   RelationshipType,
   type APIMessage,
   type APIMessageUser,
   type APIRelationshipWithoutOwner,
   type APIUser,
   type DirectChannel,
   type Snowflake,
} from "@huginnjs/shared";
import { convertToAppMessage } from "@lib/utils";
import { clientStore } from "@stores/clientStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import type { AppMessage, ProcessedMessage } from "./types";

export function createTestUser(options: { id: string }): APIUser {
   return {
      id: options.id,
      username: `testuser`,
      avatar: `avatarhash`,
      banner: `bannerhash`,
      bio: `This is test user .`,
      displayName: `Test User `,
      flags: 0,
      accentColor: null,
      bannerColor: null,
      email: `testuser@example.com`,
   };
}

export function createTestChannel(options: { type: ChannelType; id: string }): DirectChannel {
   if (options.type === ChannelType.GROUP_DM)
      return {
         id: options.id,
         icon: null,
         name: "Direct Message",
         ownerId: "456",
         recipients: [createTestUser({ id: "123" }), createTestUser({ id: "456" })],
         type: ChannelType.GROUP_DM,
         lastMessageId: null,
      };
   else if (options.type === ChannelType.DM)
      return {
         id: options.id,
         recipients: [createTestUser({ id: "123" })],
         type: ChannelType.DM,
         lastMessageId: null,
      };
   else throw new Error(`Unsupported channel type: ${options.type}`);
}

export function createTestRelationship(options: { type: RelationshipType; id: string; userId: string }): APIRelationshipWithoutOwner {
   return {
      id: options.id,
      type: options.type,
      user: createTestUser({ id: options.userId }),
      nickname: "Testy",
      since: "2023-01-01T00:00:00.000Z",
   };
}

export function createTestMessage(options: {
   id: string;
   channelId: string;
   attachments?: number;
   embeds?: number;
   mentions?: string[];
   content?: string;
   reference?: boolean;
   author: APIMessageUser;
   type: APIMessage["type"];
}): APIMessage {
   return {
      attachments: options.attachments
         ? (Array.from({ length: options.attachments }, (_, i) => ({
              id: `${i + 1}`,
              filename: `file${i + 1}.txt`,
              url: `https://example.com/file${i + 1}.txt`,
              contentType: "text/plain",
              flags: 0,
              size: 1024,
              description: `This is attachment ${i + 1}.`,
              height: 100,
              width: 200,
           })) as APIMessage["attachments"])
         : [],
      channelId: options.channelId,
      editedTimestamp: null,
      embeds: options.embeds
         ? (Array.from({ length: options.embeds }, (_, i) => ({
              type: "gifv",
              url: `https://example.com/embed${i + 1}.gif`,
              thumbnail: { url: `https://example.com/embed${i + 1}-thumbnail.gif`, width: 100, height: 100 },
              title: `Embed ${i + 1}`,
              description: `This is embed ${i + 1}.`,
              video: {
                 url: `https://example.com/embed${i + 1}.mp4`,
                 width: 640,
                 height: 360,
              },
           })) as APIMessage["embeds"])
         : [],
      mentionOwner: false,
      mentions: options.mentions?.map((id) => createTestUser({ id })) ?? [],
      mentionEveryone: false,
      content: options.content ?? `This is test message`,
      author: options.author,
      id: options.id,
      timestamp: "2023-01-01T00:00:00.000Z",
      type: options.type as APIMessage["type"],
      pinned: false,
      ...(options.type === MessageType.REPLY && options.reference
         ? {
              messageReference: {
                 channelId: options.channelId,
                 messageId: options.id,
                 type: MessageReferenceType.DEFAULT,
              },
              referencedMessage: createTestMessage({
                 id: `${parseInt(options.id) - 1}`,
                 channelId: options.channelId,
                 attachments: 0,
                 author: createTestUser({ id: options.author.id }),
                 embeds: 0,
                 type: MessageType.DEFAULT,
              }),
           }
         : {}),
   } as APIMessage;
}

export function createTestQueryClient() {
   return new QueryClient({
      defaultOptions: {
         queries: { retry: false },
         mutations: { retry: false },
      },
   });
}

export function makeAppMessage(overrides: {
   id: Snowflake;
   channelId: Snowflake;
   pinned?: boolean;
   isPreview?: boolean;
   type?: MessageType;
   mentions?: Snowflake[];
   referencedMessage?: AppMessage | null;
}): AppMessage {
   const base = convertToAppMessage(
      createTestMessage({
         author: createTestUser({ id: "1" }),
         channelId: overrides.channelId,
         id: overrides.id,
         type: overrides.type ?? MessageType.DEFAULT,
      }),
      "fetch",
   );

   return { ...base, ...overrides } as AppMessage;
}

export function makeProcessedMessages(overrides: { isActionType?: boolean; type: MessageType; content?: string }): ProcessedMessage {
   return {
      ...convertToAppMessage(
         createTestMessage({ author: createTestUser({ id: "1" }), channelId: "1", id: "1", type: overrides.type, content: overrides.content }),
         "fetch",
      ),
      hasNewAuthor: true,
      hasNewDate: true,
      hasNewMinute: true,
      isActionType: overrides.isActionType ?? false,
      isEditing: false,
      isJumpHighlighted: false,
      isUnread: false,
      isMentioned: false,
      isReplyType: false,
      isReplying: false,
      ...overrides,
   } as ProcessedMessage;
}
