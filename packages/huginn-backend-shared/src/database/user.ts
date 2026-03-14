import { assertCondition, assertId, assertObj, prisma, selectPrivateUser, type UserArgs, type UserPayload, Prisma } from "#database";
import { DBErrorType } from "#types";
import {
   idFix,
   omit,
   snowflake,
   UserFlags,
   WorkerID,
   type APIPatchCurrentUserJSONBody,
   type APIPostLoginJSONBody,
   type APIPostRegisterJSONBody,
   type BigIntToString,
   type Snowflake,
} from "@huginn/shared";

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
                  OR: [{ email: options.email }, { username: options.username?.toLowerCase() }],
                  password: { not: null },
               },
               select: selectPrivateUser,
            });

            assertObj(methodName, user, DBErrorType.NULL_USER);

            const passwordValid = await Bun.password.verify(options.password, user.password!);
            assertCondition(methodName, !passwordValid, DBErrorType.NULL_USER);

            return idFix(user) as BigIntToString<NonNullable<typeof user>>;
         },
         async edit<Args extends UserArgs>(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody, args?: Args) {
            const methodName = "user.edit";
            assertId(methodName, id);

            // Hash new password
            if (editedUser.newPassword) editedUser.newPassword = await Bun.password.hash(editedUser.newPassword);
            if (editedUser.displayName) editedUser.displayName = editedUser.displayName.trim();
            const updatedUser = await prisma.user.update({
               where: { id: BigInt(id) },
               data: {
                  ...omit(editedUser, ["newPassword", "password"]),
                  password: editedUser.newPassword,
               },
               ...args,
            });

            assertObj(methodName, updatedUser, DBErrorType.NULL_USER, id);
            return idFix(updatedUser) as UserPayload<Args>;
         },
         async createOne(options: {
            id?: bigint;
            username: string;
            displayName?: string | null;
            password?: string | null;
            email: string;
            avatar?: string | null;
         }) {
            const methodName = "user.createOne";

            if (options.displayName) options.displayName = options.displayName.trim();

            const passwordHash = options.password ? await Bun.password.hash(options.password) : null;
            const newUser = await prisma.user.create({
               data: {
                  id: options.id ?? snowflake.generate(WorkerID.AUTH),
                  username: options.username.toLowerCase(),
                  displayName: options.displayName ? options.displayName : null,
                  password: passwordHash,
                  avatar: options.avatar,
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
