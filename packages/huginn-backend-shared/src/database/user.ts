import { DBErrorType } from "@huginn/backend-shared/types";
import { idFix, snowflake, UserFlags, WorkerID, type APIPatchCurrentUserJSONBody } from "@huginn/shared";
import type { APIPostLoginJSONBody, APIPostRegisterJSONBody, BigIntToString, Snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { assertId, assertObj, prisma, selectPrivateUser, type UserArgs, type UserPayload } from ".";

export const userExtension = Prisma.defineExtension({
   model: {
      user: {
         async getById<Args extends UserArgs>(id: Snowflake, args?: Args) {
            const methodName = "user.getById";

            assertId(methodName, id);
            const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, ...args });

            assertObj(methodName, user, DBErrorType.NULL_USER, id);
            return idFix(user) as UserPayload<Args>;
         },
         async getByUsername<Args extends UserArgs>(username: string, args?: Args) {
            const methodName = "user.getByUsername";
            const user = await prisma.user.findUnique({ where: { username: username }, ...args });

            assertObj(methodName, user, DBErrorType.NULL_USER, username);
            return idFix(user) as UserPayload<Args>;
         },
         async findByCredentials(options: APIPostLoginJSONBody) {
            const methodName = "user.findByCredentials";
            const user = await prisma.user.findFirst({
               where: {
                  AND: [{ password: options.password }, { OR: [{ email: options.email }, { username: options.username?.toLowerCase() }] }],
               },
               select: selectPrivateUser,
            });

            assertObj(methodName, user, DBErrorType.NULL_USER);
            return idFix(user) as BigIntToString<NonNullable<typeof user>>;
         },
         async edit<Args extends UserArgs>(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody, args?: Args) {
            const methodName = "user.edit";
            assertId(methodName, id);
            const updatedUser = await prisma.user.update({ where: { id: BigInt(id) }, data: { ...editedUser }, ...args });

            assertObj(methodName, updatedUser, DBErrorType.NULL_USER, id);
            return idFix(updatedUser) as UserPayload<Args>;
         },
         async createOne(options: APIPostRegisterJSONBody) {
            const methodName = "user.createOne";
            const newUser = await prisma.user.create({
               data: {
                  id: snowflake.generate(WorkerID.AUTH),
                  username: options.username.toLowerCase(),
                  displayName: !options.displayName ? null : options.displayName,
                  password: options.password,
                  avatar: null,
                  email: options.email,
                  flags: UserFlags.NONE,
                  system: false,
               },
               select: selectPrivateUser,
            });

            assertObj(methodName, newUser, DBErrorType.NULL_USER);
            return idFix(newUser);
         },
         async hasChannel(userId: Snowflake, channelId: Snowflake) {
            const methodName = "user.hasChannel";
            assertId(methodName, userId, channelId);

            const hasAccess = await prisma.user.exists({
               id: BigInt(userId),
               OR: [{ includedChannels: { some: { id: BigInt(channelId) } } }, { ownedChannels: { some: { id: BigInt(channelId) } } }],
            });

            return hasAccess;
         },
      },
   },
});
