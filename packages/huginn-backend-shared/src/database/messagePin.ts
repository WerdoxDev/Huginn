import { assertExists, assertId, assertObj, prisma, Prisma, type MessagePinArgs, type MessagePinPayload } from "#database";
import { DBErrorType } from "#types";
import { idFix, type Snowflake } from "@huginn/shared";

export const messagePinExtension = Prisma.defineExtension({
   model: {
      messagePin: {
         async getChannelPins<Args extends MessagePinArgs>(channelId: Snowflake, limit: number, before?: Snowflake, args?: Args) {
            const methodName = "messagePin.getChannelPins";
            assertId(methodName, channelId);

            try {
               const pins = await prisma.messagePin.findMany({
                  where: { channelId: BigInt(channelId), ...(before ? { messageId: { lt: BigInt(before) } } : {}) },
                  orderBy: { messageId: "desc" },
                  take: limit,
                  ...args,
               });

               assertObj(methodName, pins, DBErrorType.NULL_MESSAGE_PIN);
               return idFix(pins) as MessagePinPayload<Args>[];
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               throw e;
            }
         },
         async getByMessageId<Args extends MessagePinArgs>(messageId: Snowflake, args?: Args) {
            const methodName = "messagePin.getByMessageId";
            assertId(methodName, messageId);

            try {
               const pin = await prisma.messagePin.findUnique({
                  where: { messageId: BigInt(messageId) },
                  ...args,
               });

               assertObj(methodName, pin, DBErrorType.NULL_MESSAGE_PIN, messageId);
               return idFix(pin) as MessagePinPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE_PIN, [messageId]);
               throw e;
            }
         },
         async createPin<Args extends MessagePinArgs>(
            options: { channelId: Snowflake; messageId: Snowflake; pinnedById: Snowflake; pinnedAt?: Date },
            args?: Args,
         ) {
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

               assertObj(methodName, pin, DBErrorType.NULL_MESSAGE, options.messageId);
               return idFix(pin) as MessagePinPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [options.channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE, [options.messageId]);
               await assertExists(e, methodName, DBErrorType.NULL_USER, [options.pinnedById]);
               throw e;
            }
         },
         async deletePin<Args extends MessagePinArgs>(channelId: Snowflake, messageId: Snowflake, args?: Args) {
            const methodName = "messagePin.deletePin";
            assertId(methodName, channelId, messageId);

            try {
               const pin = await prisma.messagePin.findUnique({
                  where: { channelId: BigInt(channelId), messageId: BigInt(messageId) },
                  select: { messageId: true },
               });

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
               await assertExists(e, methodName, DBErrorType.NULL_MESSAGE_PIN, [messageId]);
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               throw e;
            }
         },
      },
   },
});
