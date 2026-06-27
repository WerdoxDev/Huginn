import { analytics, idFix, recordSpanError, type Snowflake } from "@huginn/shared";

import { assertExists, assertId, assertObj, prisma, Prisma, type MessagePinArgs, type MessagePinPayload } from "#database";
import { DBErrorType } from "#types";

export const messagePinExtension = Prisma.defineExtension({
   model: {
      messagePin: {
         async getChannelPins<Args extends MessagePinArgs>(channelId: Snowflake, limit: number, before?: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.messagePin.getChannelPins", async (span) => {
               span.setAttributes({
                  "query.channel.id": channelId,
                  "query.limit": limit,
                  "query.has_before": !!before,
               });

               const methodName = "messagePin.getChannelPins";
               assertId(methodName, channelId);

               try {
                  const pins = await prisma.messagePin.findMany({
                     where: { channelId: BigInt(channelId), ...(before ? { messageId: { lt: BigInt(before) } } : {}) },
                     orderBy: { messageId: "desc" },
                     take: limit,
                     ...args,
                  });

                  span.setAttribute("pins.count", pins.length);

                  assertObj(methodName, pins, DBErrorType.NULL_MESSAGE_PIN);
                  return idFix(pins) as MessagePinPayload<Args>[];
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async getByMessageId<Args extends MessagePinArgs>(messageId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.messagePin.getByMessageId", async (span) => {
               span.setAttribute("query.message.id", messageId);

               const methodName = "messagePin.getByMessageId";
               assertId(methodName, messageId);

               try {
                  const pin = await prisma.messagePin.findUnique({
                     where: { messageId: BigInt(messageId) },
                     ...args,
                  });

                  span.setAttribute("pin.found", !!pin);

                  assertObj(methodName, pin, DBErrorType.NULL_MESSAGE_PIN, messageId);
                  return idFix(pin) as MessagePinPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE_PIN, [messageId]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async createPin<Args extends MessagePinArgs>(
            options: { channelId: Snowflake; messageId: Snowflake; pinnedById: Snowflake; pinnedAt?: Date },
            args?: Args,
         ) {
            return analytics.startActiveSpan("db.messagePin.createPin", async (span) => {
               span.setAttributes({
                  "query.channel.id": options.channelId,
                  "query.message.id": options.messageId,
                  "query.user.id": options.pinnedById,
               });

               const methodName = "messagePin.createPin";
               assertId(methodName, options.channelId, options.messageId, options.pinnedById);

               try {
                  const [, pin] = await prisma.$transaction([
                     prisma.message.update({
                        where: { id: BigInt(options.messageId) },
                        data: { pinned: true },
                        select: { id: true },
                     }),
                     prisma.messagePin.create({
                        data: {
                           messageId: BigInt(options.messageId),
                           channelId: BigInt(options.channelId),
                           pinnedById: BigInt(options.pinnedById),
                           pinnedAt: options.pinnedAt ?? new Date(),
                        },
                        ...args,
                     }),
                  ]);

                  if (pin.messageId) span.setAttribute("pin.message.id", pin.messageId.toString());
                  if (pin.channelId) span.setAttribute("pin.channel.id", pin.channelId.toString());
                  if (pin.pinnedAt) span.setAttribute("pin.pinned.at", pin.pinnedAt.toISOString());

                  assertObj(methodName, pin, DBErrorType.NULL_MESSAGE, options.messageId);
                  return idFix(pin) as MessagePinPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [options.channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [options.messageId]);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [options.pinnedById]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async deletePin<Args extends MessagePinArgs>(channelId: Snowflake, messageId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.messagePin.deletePin", async (span) => {
               span.setAttributes({ "query.channel.id": channelId, "query.message.id": messageId });

               const methodName = "messagePin.deletePin";
               assertId(methodName, channelId, messageId);

               try {
                  const pin = await prisma.messagePin.findUnique({
                     where: { channelId: BigInt(channelId), messageId: BigInt(messageId) },
                     select: { messageId: true },
                  });

                  span.setAttribute("pin.found", !!pin);

                  assertObj(methodName, pin, DBErrorType.NULL_MESSAGE_PIN, messageId);

                  const [, deletedPin] = await prisma.$transaction([
                     prisma.message.update({
                        where: { id: BigInt(messageId) },
                        data: { pinned: false },
                        select: { id: true },
                     }),
                     prisma.messagePin.delete({
                        where: { messageId: BigInt(messageId) },
                        ...args,
                     }),
                  ]);

                  assertObj(methodName, deletedPin, DBErrorType.NULL_MESSAGE_PIN, messageId);
                  return idFix(deletedPin) as MessagePinPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_MESSAGE_PIN, [messageId]);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
      },
   },
});
