import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { APIPostRegisterResult, constants, Errors, HttpCode, idFix } from "@huginn/shared";
import { z } from "zod";

const schema = z.object({
   username: z.string(),
   displayName: z.nullable(z.string()),
   email: z.string(),
   password: z.string(),
});

export default defineEventHandler(async () => {
   const body = await useValidatedBody(schema);
   body.username = body.username.toLowerCase();

   const formError = createErrorFactory(Errors.invalidFormBody());

   validateUsername(body.username, formError);
   validateDisplayName(body.displayName, formError);
   validatePassword(body.password, formError);
   validateEmail(body.email, formError);

   if (formError.hasErrors()) {
      return createHuginnError(useEvent(), formError);
   }

   const databaseError = createErrorFactory(Errors.invalidFormBody());

   await validateUsernameUnique(body.username, databaseError);
   await validateEmailUnique(body.email, databaseError);

   if (databaseError.hasErrors()) {
      return createHuginnError(useEvent(), databaseError);
   }

   const user = idFix(await prisma.user.registerNew(body));

   const [accessToken, refreshToken] = await createTokens(
      { id: user.id },
      constants.ACCESS_TOKEN_EXPIRE_TIME,
      constants.REFRESH_TOKEN_EXPIRE_TIME,
   );

   const json: APIPostRegisterResult = { ...user, token: accessToken, refreshToken: refreshToken };
   setResponseStatus(useEvent(), HttpCode.CREATED);
   return json;
});
