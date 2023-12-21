import { Prisma } from "@prisma/client";
import { APIPatchCurrentUserJSONBody } from "@shared/api-types";
import { Snowflake } from "@shared/types";
import { assertUserIsDefined, prisma } from ".";
import { UserInclude, UserPayload } from "./database-common";

const userExtention = Prisma.defineExtension({
   model: {
      user: {
         async getById<I extends UserInclude>(id: Snowflake, include?: I) {
            const user = await prisma.user.findUnique({ where: { id: id }, include: include });

            assertUserIsDefined("getById", user, id);
            return user as UserPayload<I>;
         },
         async edit(id: Snowflake, editedUser: APIPatchCurrentUserJSONBody) {
            const updatedUser = await prisma.user.update({ where: { id: id }, data: { ...editedUser } });

            assertUserIsDefined("edit", updatedUser, id);
            return updatedUser;
         },
      },
   },
});

export default userExtention;
