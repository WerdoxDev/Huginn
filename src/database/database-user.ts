import { Prisma } from "@prisma/client";
import { APIPatchCurrentUserJSONBody } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";
import { DBErrorType, assertBoolWithCause, assertObjectWithCause, prisma } from ".";
import { UserInclude, UserPayload } from "./database-common";

const userExtention = Prisma.defineExtension({
   model: {
      user: {
         async getById<Include extends UserInclude>(id: Snowflake, include?: Include) {
            const user = await prisma.user.findUnique({ where: { id: id }, include: include });

            assertObjectWithCause("getById", user, DBErrorType.NULL_USER, id);
            return user as UserPayload<Include>;
         },
         async getByUsername<Include extends UserInclude>(username: string, include?: Include) {
            const user = await prisma.user.findUnique({ where: { username: username }, include: include });

            assertObjectWithCause("getByUsername", user, DBErrorType.NULL_USER, username);
            return user as UserPayload<Include>;
         },
         async edit(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody) {
            const updatedUser = await prisma.user.update({ where: { id: id }, data: { ...editedUser } });

            assertObjectWithCause("edit", updatedUser, DBErrorType.NULL_USER, id);
            return updatedUser;
         },
         async assertUserExists(methodName: string, id: Snowflake) {
            const userExists = await prisma.user.exists({ id });
            assertBoolWithCause(methodName, !userExists, DBErrorType.NULL_USER, id);
         },
      },
   },
});

export default userExtention;
