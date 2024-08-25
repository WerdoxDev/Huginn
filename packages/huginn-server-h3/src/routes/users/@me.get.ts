import { APIGetCurrentUserResult, HttpCode, idFix } from "@huginn/shared";

export default defineEventHandler(async () => {
   const { payload } = await useVerifiedJwt();

   const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id));

   setResponseStatus(useEvent(), HttpCode.OK);
   return user;
});
