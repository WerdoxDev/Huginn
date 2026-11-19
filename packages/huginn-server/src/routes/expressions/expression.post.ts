import type { APIPostExpressionAddResult, ExpressionKind } from "@huginnjs/shared";

import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia from "elysia";

import { expressionReferenceSchema, resolveExpression } from "#utils/expressions";

export function postUserExpression<const Kind extends ExpressionKind>(kind: Kind) {
   return new Elysia().use(verifyJwt()).post(
      `/api/users/@me/${kind}`,
      async ({ tokenPayload, body, status }) => {
         const media = await resolveExpression(kind, body);
         if (!media) return invalidBody(status);

         await prisma.userExpression.createUserExpression(tokenPayload.id, kind, media);

         const json: APIPostExpressionAddResult = media;
         return status("Created", json);
      },
      { body: expressionReferenceSchema },
   );
}
