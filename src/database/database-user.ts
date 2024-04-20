import { Prisma } from "@prisma/client";
import { APIPatchCurrentUserJSONBody } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";
import { DBErrorType, assertBoolWithCause, assertObjectWithCause, prisma } from ".";
import { UserInclude, UserPayload } from "./database-common";

const userExtention = Prisma.defineExtension({
   model: {
      user: {
         async getById<I extends UserInclude>(id: Snowflake, include?: I) {
            const user = await prisma.user.findUnique({ where: { id: id }, include: include });

            assertObjectWithCause("getById", user, DBErrorType.NULL_USER, id);
            return user as UserPayload<I>;
         },
         async getByUsername<I extends UserInclude>(username: string, include?: I) {
            const user = await prisma.user.findUnique({ where: { username: username }, include: include });

            assertObjectWithCause("getByUsername", user, DBErrorType.NULL_USER, username);
            return user as UserPayload<I>;
         },
         async edit(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody) {
            const updatedUser = await prisma.user.update({ where: { id: id }, data: { ...editedUser } });

            assertObjectWithCause("edit", updatedUser, DBErrorType.NULL_USER, id);
            return updatedUser;
         },
         async assertUserExists(methodName: string, id: Snowflake) {
            assertBoolWithCause(methodName, !(await prisma.user.exists({ id })), DBErrorType.NULL_USER, id);
         },
      },
   },
});

export default userExtention;
