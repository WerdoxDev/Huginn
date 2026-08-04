import { TransportError } from "@huginnjs/api";
import {
   ActivityType,
   ChannelType,
   MessageReferenceType,
   MessageType,
   RelationshipType,
   VoiceSignallingError,
   type APIDMChannel,
   type APIMessage,
   type APIRelationshipWithoutOwner,
   type APIUserProfile,
   type DirectChannel,
   type PresenceUser,
   type UserPresence,
} from "@huginnjs/shared";
import { describe, expect, test } from "vitest";

import { createTestChannel, createTestMessage, createTestRelationship, createTestUser } from "@/test-utils";

import {
   convertToAppDirectChannel,
   convertToAppMessage,
   convertToAppPresence,
   convertToAppRelationship,
   convertToAppUser,
   convertToAppUserProfile,
   getMediaErrorMessage,
} from "./utils";

describe("utils", () => {
   test("should recognize transport errors from the current and another window", () => {
      const localError = new TransportError("Wrong voice state", VoiceSignallingError.WRONG_STATE);
      const crossWindowError = {
         name: "TransportError",
         message: "Wrong voice state",
         code: VoiceSignallingError.WRONG_STATE,
      };

      expect(getMediaErrorMessage(localError, "camera")).toBe("The voice connection is in the wrong state. Please try again.");
      expect(getMediaErrorMessage(crossWindowError, "camera")).toBe("The voice connection is in the wrong state. Please try again.");
   });

   test("should convert api message to app message", () => {
      const apiMessage1: APIMessage = createTestMessage({
         attachments: 1,
         embeds: 1,
         mentions: ["234"],
         content: "Hello, world!",
         reference: true,
         author: createTestUser({ id: "123" }),
         channelId: "345",
         id: "789",
         type: MessageType.DEFAULT,
      });

      const apiMessage2: APIMessage = createTestMessage({
         attachments: 1,
         embeds: 1,
         mentions: ["234"],
         content: "Hello, world!",
         reference: true,
         author: createTestUser({ id: "123" }),
         channelId: "345",
         id: "789",
         type: MessageType.REPLY,
      });

      const appMessage1 = convertToAppMessage(apiMessage1, "fetch");
      const appMessage2 = convertToAppMessage(apiMessage2, "fetch");

      expect(appMessage1).toMatchInlineSnapshot(`
        {
          "attachments": [
            {
              "contentType": "text/plain",
              "description": "This is attachment 1.",
              "filename": "file1.txt",
              "flags": 0,
              "height": 100,
              "id": "1",
              "size": 1024,
              "url": "https://example.com/file1.txt",
              "width": 200,
            },
          ],
          "authorId": "123",
          "channelId": "345",
          "content": "Hello, world!",
          "editedTimestamp": null,
          "embeds": [
            {
              "description": "This is embed 1.",
              "thumbnail": {
                "height": 100,
                "url": "https://example.com/embed1-thumbnail.gif",
                "width": 100,
              },
              "title": "Embed 1",
              "type": "gifv",
              "url": "https://example.com/embed1.gif",
              "video": {
                "height": 360,
                "url": "https://example.com/embed1.mp4",
                "width": 640,
              },
            },
          ],
          "id": "789",
          "isPreview": false,
          "mentionEveryone": false,
          "mentionOwner": false,
          "mentions": [
            "234",
          ],
          "pinned": false,
          "source": "fetch",
          "timestamp": "2023-01-01T00:00:00.000Z",
          "type": 0,
        }
      `);
      expect(appMessage2).toMatchInlineSnapshot(`
        {
          "attachments": [
            {
              "contentType": "text/plain",
              "description": "This is attachment 1.",
              "filename": "file1.txt",
              "flags": 0,
              "height": 100,
              "id": "1",
              "size": 1024,
              "url": "https://example.com/file1.txt",
              "width": 200,
            },
          ],
          "authorId": "123",
          "channelId": "345",
          "content": "Hello, world!",
          "editedTimestamp": null,
          "embeds": [
            {
              "description": "This is embed 1.",
              "thumbnail": {
                "height": 100,
                "url": "https://example.com/embed1-thumbnail.gif",
                "width": 100,
              },
              "title": "Embed 1",
              "type": "gifv",
              "url": "https://example.com/embed1.gif",
              "video": {
                "height": 360,
                "url": "https://example.com/embed1.mp4",
                "width": 640,
              },
            },
          ],
          "id": "789",
          "isPreview": false,
          "mentionEveryone": false,
          "mentionOwner": false,
          "mentions": [
            "234",
          ],
          "messageReference": {
            "channelId": "345",
            "messageId": "789",
            "type": 0,
          },
          "pinned": false,
          "referencedMessage": {
            "attachments": [],
            "authorId": "123",
            "channelId": "345",
            "content": "This is test message",
            "editedTimestamp": null,
            "embeds": [],
            "id": "788",
            "isPreview": false,
            "mentionEveryone": false,
            "mentionOwner": false,
            "mentions": [],
            "pinned": false,
            "source": "fetch",
            "timestamp": "2023-01-01T00:00:00.000Z",
            "type": 0,
          },
          "source": "fetch",
          "timestamp": "2023-01-01T00:00:00.000Z",
          "type": 9,
        }
      `);
   });

   test("should convert api direct channel to app channel", () => {
      const apiChannel1: DirectChannel = createTestChannel({ type: ChannelType.DM, id: "789" });
      const apiChannel2: DirectChannel = createTestChannel({ type: ChannelType.GROUP_DM, id: "7435" });

      const appChannel1 = convertToAppDirectChannel(apiChannel1);
      const appChannel2 = convertToAppDirectChannel(apiChannel2);

      expect(appChannel1).toMatchInlineSnapshot(`
        {
          "id": "789",
          "lastMessageId": null,
          "name": "Test User ",
          "originalName": undefined,
          "recipientIds": [
            "123",
          ],
          "type": 0,
        }
      `);
      expect(appChannel2).toMatchInlineSnapshot(`
        {
          "icon": null,
          "id": "7435",
          "lastMessageId": null,
          "name": "Direct Message",
          "originalName": "Direct Message",
          "ownerId": "456",
          "recipientIds": [
            "123",
            "456",
          ],
          "type": 1,
        }
      `);
   });

   test("should convert api relationship to app relationship", () => {
      const apiRelationship1: APIRelationshipWithoutOwner = createTestRelationship({ type: RelationshipType.FRIEND, id: "456", userId: "456" });
      const apiRelationship2: APIRelationshipWithoutOwner = createTestRelationship({
         type: RelationshipType.PENDING_INCOMING,
         id: "457",
         userId: "457",
      });
      const apiRelationship3: APIRelationshipWithoutOwner = createTestRelationship({
         type: RelationshipType.PENDING_OUTGOING,
         id: "458",
         userId: "458",
      });

      const appRelationship1 = convertToAppRelationship(apiRelationship1);
      const appRelationship2 = convertToAppRelationship(apiRelationship2);
      const appRelationship3 = convertToAppRelationship(apiRelationship3);

      expect(appRelationship1).toMatchInlineSnapshot(`
        {
          "id": "456",
          "nickname": "Testy",
          "since": "2023-01-01T00:00:00.000Z",
          "type": 1,
          "userId": "456",
        }
      `);
      expect(appRelationship2).toMatchInlineSnapshot(`
        {
          "id": "457",
          "nickname": "Testy",
          "since": "2023-01-01T00:00:00.000Z",
          "type": 3,
          "userId": "457",
        }
      `);
      expect(appRelationship3).toMatchInlineSnapshot(`
        {
          "id": "458",
          "nickname": "Testy",
          "since": "2023-01-01T00:00:00.000Z",
          "type": 4,
          "userId": "458",
        }
      `);
   });

   test("should convert api user to app user", () => {
      const apiUser: PresenceUser = createTestUser({ id: "314" });

      const appUser = convertToAppUser(apiUser);

      expect(appUser).toMatchInlineSnapshot(`
        {
          "accentColor": null,
          "avatar": "avatarhash",
          "banner": "bannerhash",
          "bannerColor": null,
          "bio": "This is test user .",
          "displayName": "Test User ",
          "email": "testuser@example.com",
          "flags": 0,
          "id": "314",
          "originalDisplayName": "Test User ",
          "username": "testuser",
        }
      `);
   });

   test("should convert api user profile to app user profile", () => {
      const apiUserProfile: APIUserProfile = {
         user: createTestUser({ id: "53" }),
         badges: [{ id: "bug_hunter", color: "#ff0000", description: "Bug Hunter", icon: "https://example.com/badge.png" }],
      };

      const appUserProfile = convertToAppUserProfile(apiUserProfile);

      expect(appUserProfile).toMatchInlineSnapshot(`
        {
          "badges": [
            {
              "color": "#ff0000",
              "description": "Bug Hunter",
              "icon": "https://example.com/badge.png",
              "id": "bug_hunter",
            },
          ],
          "userId": "53",
        }
      `);
   });

   test("should convert api presence to app presence", () => {
      const apiPresence: UserPresence = {
         user: createTestUser({ id: "123" }),
         activeSessions: [{ sessionId: "123" }],
         activities: [
            {
               name: "Playing a game",
               type: ActivityType.PLAYING,
               createdAt: 1783539075514,
               sessionId: "123",
               applicationId: 123,
               iconUrl: "/game-icon.png",
               startedAt: 1783539075514,
            },
         ],
         status: "online",
      };

      const appPresence = convertToAppPresence(apiPresence);

      expect(appPresence).toMatchInlineSnapshot(`
        {
          "activeSessions": [
            {
              "sessionId": "123",
            },
          ],
          "activities": [
            {
              "applicationId": 123,
              "createdAt": 1783539075514,
              "iconUrl": "https://midgard.huginn.dev/cdn/game-icon.png",
              "name": "Playing a game",
              "sessionId": "123",
              "startedAt": 1783539075514,
              "type": 0,
            },
          ],
          "status": "online",
          "userId": "123",
        }
      `);
   });
});
