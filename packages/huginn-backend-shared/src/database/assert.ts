import { analytics, recordSpanError, type Snowflake } from "@huginn/shared";

import { Prisma } from "#database";
import { assertCondition, assertId, prisma } from "#database";
import { DBErrorType } from "#types";

export const assertExtension = Prisma.defineExtension({
   model: {
      user: {
         async assertUsersExist(methodName: string, userIds: Snowflake[]) {
            return analytics.startActiveSpan("db.user.assertUsersExist", async (span) => {
               span.setAttribute("query.user.count", userIds.length);
               try {
                  assertId(methodName, ...userIds);
                  const foundCount = await prisma.user.count({
                     where: { id: { in: userIds.map((x) => BigInt(x)) } },
                  });
                  assertCondition(methodName, foundCount !== userIds.length, DBErrorType.NULL_USER, userIds.join(","));
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      channel: {
         async assertChannelsExist(methodName: string, channelIds: Snowflake[]) {
            return analytics.startActiveSpan("db.channel.assertChannelsExist", async (span) => {
               span.setAttribute("query.channel.count", channelIds.length);
               try {
                  assertId(methodName, ...channelIds);
                  const foundCount = await prisma.channel.count({
                     where: { id: { in: channelIds.map((x) => BigInt(x)) } },
                  });
                  assertCondition(methodName, foundCount !== channelIds.length, DBErrorType.NULL_CHANNEL, channelIds.join(","));
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      relationship: {
         async assertRelationshipsExist(methodName: string, relationshipIds: Snowflake[]) {
            return analytics.startActiveSpan("db.relationship.assertRelationshipsExist", async (span) => {
               span.setAttribute("query.relationship.count", relationshipIds.length);
               try {
                  assertId(methodName, ...relationshipIds);
                  const foundCount = await prisma.relationship.count({
                     where: { id: { in: relationshipIds.map((x) => BigInt(x)) } },
                  });
                  assertCondition(methodName, foundCount !== relationshipIds.length, DBErrorType.NULL_RELATIONSHIP, relationshipIds.join(","));
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      message: {
         async assertMessagesExist(methodName: string, messageIds: Snowflake[]) {
            return analytics.startActiveSpan("db.message.assertMessagesExist", async (span) => {
               span.setAttribute("query.message.count", messageIds.length);
               try {
                  assertId(methodName, ...messageIds);
                  const foundCount = await prisma.message.count({
                     where: { id: { in: messageIds.map((x) => BigInt(x)) } },
                  });
                  assertCondition(methodName, foundCount !== messageIds.length, DBErrorType.NULL_MESSAGE, messageIds.join(","));
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      messagePin: {
         async assertMessagePinExist(methodName: string, messageIds: Snowflake[]) {
            return analytics.startActiveSpan("db.messagePin.assertMessagePinExist", async (span) => {
               span.setAttribute("query.message_pin.count", messageIds.length);
               try {
                  assertId(methodName, ...messageIds);
                  const foundCount = await prisma.messagePin.count({
                     where: { messageId: { in: messageIds.map((x) => BigInt(x)) } },
                  });
                  assertCondition(methodName, foundCount !== messageIds.length, DBErrorType.NULL_MESSAGE_PIN, messageIds.join(","));
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      readState: {
         async assertReadStatesExist(methodName: string, idPairs: { userId: Snowflake; channelId: Snowflake }[]) {
            return analytics.startActiveSpan("db.readState.assertReadStatesExist", async (span) => {
               span.setAttribute("query.read_state.count", idPairs.length);
               try {
                  assertId(methodName, ...idPairs.flatMap((x) => [x.userId, x.channelId]));
                  const foundCount = await prisma.readState.count({
                     where: {
                        channelId: { in: idPairs.map((x) => BigInt(x.channelId)) },
                        userId: { in: idPairs.map((x) => BigInt(x.userId)) },
                     },
                  });
                  assertCondition(
                     methodName,
                     foundCount !== idPairs.length,
                     DBErrorType.NULL_READ_STATE,
                     idPairs.map((x) => `${x.userId}:${x.channelId}`).join(","),
                  );
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      reaction: {
         async assertReactionsExist(methodName: string, idPairs: { userId: Snowflake; messageId: Snowflake; channelId: Snowflake; emojiKey: string }[]) {
            return analytics.startActiveSpan("db.reaction.assertReactionsExist", async (span) => {
               span.setAttribute("query.reaction.count", idPairs.length);
               try {
                  assertId(methodName, ...idPairs.flatMap((x) => [x.userId, x.messageId, x.channelId]));
                  const foundCount = await prisma.reaction.count({
                     where: {
                        channelId: { in: idPairs.map((x) => BigInt(x.channelId)) },
                        messageId: { in: idPairs.map((x) => BigInt(x.messageId)) },
                        userId: { in: idPairs.map((x) => BigInt(x.userId)) },
                        emojiKey: { in: idPairs.map((x) => x.emojiKey) },
                     },
                  });
                  assertCondition(
                     methodName,
                     foundCount !== idPairs.length,
                     DBErrorType.NULL_REACTION,
                     idPairs.map((x) => `${x.userId}:${x.messageId}:${x.channelId}:${x.emojiKey}`).join(","),
                  );
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      reactionAggregate: {
         async assertReactionAggregatesExist(methodName: string, idPairs: { messageId: Snowflake; emojiKey: string }[]) {
            return analytics.startActiveSpan("db.reactionAggregate.assertReactionAggregatesExist", async (span) => {
               span.setAttribute("query.reaction_aggregate.count", idPairs.length);
               try {
                  assertId(methodName, ...idPairs.flatMap((x) => [x.messageId]));
                  const foundCount = await prisma.reactionAggregate.count({
                     where: {
                        messageId: { in: idPairs.map((x) => BigInt(x.messageId)) },
                        emojiKey: { in: idPairs.map((x) => x.emojiKey) },
                     },
                  });
                  assertCondition(
                     methodName,
                     foundCount !== idPairs.length,
                     DBErrorType.NULL_REACTION_AGGREGATE,
                     idPairs.map((x) => `${x.messageId}:${x.emojiKey}`).join(","),
                  );
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
      knownApplication: {
         async assertKnownApplicationsExist(methodName: string, knownApplicationIds: number[]) {
            return analytics.startActiveSpan("db.knownApplication.assertKnownApplicationsExist", async (span) => {
               span.setAttribute("query.known_application.count", knownApplicationIds.length);
               try {
                  const foundCount = await prisma.knownApplication.count({
                     where: { id: { in: knownApplicationIds } },
                  });
                  assertCondition(methodName, foundCount !== knownApplicationIds.length, DBErrorType.NULL_KNOWN_APPLICATION, knownApplicationIds.join(","));
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
   },
});
