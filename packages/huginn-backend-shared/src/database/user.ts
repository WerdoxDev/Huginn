import {
   analytics,
   idFix,
   omit,
   recordSpanError,
   snowflake,
   UserFlags,
   WorkerID,
   type APIPatchCurrentUserJSONBody,
   type APIPostLoginJSONBody,
   type BigIntToString,
   type Snowflake,
} from "@huginn/shared";

import { assertCondition, assertId, assertObj, prisma, selectPrivateUser, type UserArgs, type UserPayload, Prisma, assertExists } from "#database";
import { DBErrorType } from "#types";

export const userExtension = Prisma.defineExtension({
   model: {
      user: {
         async getById<Args extends UserArgs>(id: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.user.getById", async (span) => {
               span.setAttribute("query.user.id", id);
               const methodName = "user.getById";

               assertId(methodName, id);
               try {
                  const user = await prisma.user.findUniqueOrThrow({ where: { id: BigInt(id) }, ...args });

                  return idFix(user) as UserPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [id]);
                  throw e;
               }
            });
         },
         async getByUsername<Args extends UserArgs>(username: string, args?: Args) {
            return analytics.startActiveSpan("db.user.getByUsername", async (span) => {
               span.setAttribute("query.username.length", username.length);
               const methodName = "user.getByUsername";
               try {
                  const user = await prisma.user.findFirstOrThrow({ where: { username: username }, ...args });
                  return idFix(user) as UserPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [username]);
                  throw e;
               }
            });
         },
         async findByCredentials(options: APIPostLoginJSONBody) {
            return analytics.startActiveSpan("db.user.findByCredentials", async (span) => {
               span.setAttributes({
                  "query.has_email": !!options.email,
                  "query.has_username": !!options.username,
               });
               const methodName = "user.findByCredentials";

               try {
                  const user = await prisma.user.findFirst({
                     where: {
                        OR: [{ email: options.email }, { username: options.username?.toLowerCase() }],
                        password: { not: null },
                     },
                     select: { ...selectPrivateUser, password: true },
                  });

                  span.setAttribute("user.found", !!user);
                  assertObj(methodName, user, DBErrorType.NULL_USER);

                  const passwordValid = await Bun.password.verify(options.password, user.password!);
                  span.setAttribute("user.password.valid", passwordValid);
                  assertCondition(methodName, !passwordValid, DBErrorType.NULL_USER);

                  return idFix(omit(user, ["password"])) as BigIntToString<NonNullable<typeof user>>;
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async edit<Args extends UserArgs>(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody, args?: Args) {
            return analytics.startActiveSpan("db.user.edit", async (span) => {
               span.setAttributes({
                  "query.user.id": id,
                  "query.key_count": Object.keys(editedUser).length,
                  "query.has_new_password": !!editedUser.newPassword,
                  "query.has_display_name": editedUser.displayName !== undefined,
               });
               const methodName = "user.edit";
               assertId(methodName, id);

               try {
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

                  span.setAttribute("updated_user.id", updatedUser.id.toString());

                  assertObj(methodName, updatedUser, DBErrorType.NULL_USER, id);
                  return idFix(updatedUser) as UserPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async createOne(options: {
            id?: bigint;
            username: string;
            displayName?: string | null;
            password?: string | null;
            email: string;
            avatar?: string | null;
         }) {
            return analytics.startActiveSpan("db.user.createOne", async (span) => {
               span.setAttributes({
                  "query.has_custom_id": !!options.id,
                  "query.has_password": !!options.password,
                  "query.has_display_name": !!options.displayName,
                  "query.has_avatar": !!options.avatar,
                  "query.has_email": !!options.email,
               });
               const methodName = "user.createOne";

               try {
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

                  span.setAttribute("user.id", newUser.id.toString());

                  assertObj(methodName, newUser, DBErrorType.NULL_USER);
                  return idFix(newUser);
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async hasChannel(userId: Snowflake, channelId: Snowflake) {
            return analytics.startActiveSpan("db.user.hasChannel", async (span) => {
               span.setAttributes({ "query.user.id": userId, "query.channel.id": channelId });
               const methodName = "user.hasChannel";
               assertId(methodName, userId, channelId);

               try {
                  const hasAccess = await prisma.user.exists({
                     id: BigInt(userId),
                     OR: [{ includedChannels: { some: { id: BigInt(channelId) } } }, { ownedChannels: { some: { id: BigInt(channelId) } } }],
                  });

                  span.setAttribute("user.has_channel_access", hasAccess);

                  return hasAccess;
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
   },
});
