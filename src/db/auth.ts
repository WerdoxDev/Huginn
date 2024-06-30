import { Prisma } from "@prisma/client";
import { APIPostLoginJSONBody, APIPostRegisterJSONBody } from "@shared/api-types";
import { snowflake } from "@shared/snowflake";
import { DBErrorType, assertObj, prisma } from ".";

const authExtention = Prisma.defineExtension({
   name: "auth",
   model: {
      user: {
         async findByCredentials(credentials: APIPostLoginJSONBody) {
            const user = await prisma.user.findFirst({
               where: {
                  AND: [
                     { password: credentials.password },
                     { OR: [{ email: credentials.email }, { username: credentials.username }] },
                  ],
               },
            });

            assertObj("findByCredentials", user, DBErrorType.NULL_USER);
            return user;
         },
         async registerNew(user: APIPostRegisterJSONBody) {
            const displayName = user.displayName || user.username;

            const newUser = await prisma.user.create({
               data: {
                  id: snowflake.generate(),
                  username: user.username,
                  displayName,
                  password: user.password,
                  email: user.email,
                  avatar: "test-avatar",
                  flags: 0,
                  system: false,
               },
            });

            assertObj("registerNew", newUser, DBErrorType.NULL_USER);
            return newUser;
         },
      },
   },
});

export default authExtention;
