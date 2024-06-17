import { Prisma } from "@prisma/client";
import { APIPatchCurrentUserJSONBody } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";
import { DBErrorType, assertCondition, assertId, assertObj, prisma } from ".";
import { UserInclude, UserPayload } from "./database-common";

const userExtention = Prisma.defineExtension({
   model: {
      user: {
         async getById<Include extends UserInclude>(id: Snowflake, include?: Include) {
            assertId("getById", id);
            const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, include: include });

            assertObj("getById", user, DBErrorType.NULL_USER, id);
            return user as UserPayload<Include>;
         },
         async getByUsername<Include extends UserInclude>(username: string, include?: Include) {
            const user = await prisma.user.findUnique({ where: { username: username }, include: include });

            assertObj("getByUsername", user, DBErrorType.NULL_USER, username);
            return user as UserPayload<Include>;
         },
         async edit(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody) {
            assertId("edit", id);
            const updatedUser = await prisma.user.update({ where: { id: BigInt(id) }, data: { ...editedUser } });

            assertObj("edit", updatedUser, DBErrorType.NULL_USER, id);
            return updatedUser;
         },
         async assertUserExists(methodName: string, id: Snowflake) {
            assertId(methodName, id);
            const userExists = await prisma.user.exists({ id: BigInt(id) });
            assertCondition(methodName, !userExists, DBErrorType.NULL_USER, id);
         },
      },
   },
});

export default userExtention;
