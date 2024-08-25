import { APIGetUserByIdResult, HttpCode, idFix, omit } from "@huginn/shared";
import { z } from "zod";

const schema = z.object({ userId: z.string() });

export default defineEventHandler(async () => {
   await useVerifiedJwt();
   const userId = (await useValidatedParams(schema)).userId;

   const user: APIGetUserByIdResult = idFix(omit(await prisma.user.getById(userId), ["email"]));

   setResponseStatus(useEvent(), HttpCode.OK);
   return user;
});
