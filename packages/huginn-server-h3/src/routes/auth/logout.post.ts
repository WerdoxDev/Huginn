import { HttpCode } from "@huginn/shared";

export default defineEventHandler(async () => {
   const { token } = await useVerifiedJwt();

   tokenInvalidator.invalidate(token);

   return sendNoContent(useEvent(), HttpCode.NO_CONTENT);
});
