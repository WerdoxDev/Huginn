import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { APIPostLoginResult, constants, Errors, Fields, HttpCode, idFix } from "@huginn/shared";
import { z } from "zod";

const schema = z.object({
   username: z.optional(z.string()),
   email: z.optional(z.string()),
   password: z.string(),
});

export default defineEventHandler(async () => {
   const body = await useValidatedBody(schema);

   const [error, user] = await catchError(async () => idFix(await prisma.user.findByCredentials(body)));

   if (error && isDBError(error) && error.isErrorType(DBErrorType.NULL_USER)) {
      return createHuginnError(
         useEvent(),
         createErrorFactory(Errors.invalidFormBody())
            .addError("login", Fields.invalidLogin())
            .addError("password", Fields.invalidLogin()),
      );
   } else if (error) throw error;

   const [accessToken, refreshToken] = await createTokens(
      { id: user.id },
      constants.ACCESS_TOKEN_EXPIRE_TIME,
      constants.REFRESH_TOKEN_EXPIRE_TIME,
   );

   const json: APIPostLoginResult = { ...user, token: accessToken, refreshToken: refreshToken };
   setResponseStatus(useEvent(), HttpCode.OK);
   return json;
});

// const app = new Hono();

// app.post("/auth/login", hValidator("json", schema), c =>
//    handleRequest(
//       c,
//       async () => {
//          const body = c.req.valid("json");
//          const user = idFix(await prisma.user.findByCredentials(body));

//          const [accessToken, refreshToken] = await createTokens(
//             { id: user.id },
//             constants.ACCESS_TOKEN_EXPIRE_TIME,
//             constants.REFRESH_TOKEN_EXPIRE_TIME,
//          );
//          const json: APIPostLoginResult = { ...user, token: accessToken, refreshToken: refreshToken };

//          return c.json(json, HttpCode.OK);
//       },
//       e => {
//          if (e.isErrorType(DBErrorType.NULL_USER)) {
//             return errorResponse(
//                c,
//                createError(Error.invalidFormBody()).addError("login", Field.invalidLogin()).addError("password", Field.invalidLogin()),
//             );
//          }
//       },
//    ),
// );
