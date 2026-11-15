import type { ExpressionKind } from "@huginnjs/shared";

import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

export function deleteUserExpression<const Kind extends ExpressionKind>(kind: Kind) {
   return new Elysia().use(verifyJwt()).delete(
      `/api/users/@me/${kind}/:type/:id`,
      async ({ tokenPayload, params, status }) => {
         await prisma.userExpression.deleteMany({ where: { userId: BigInt(tokenPayload.id), kind, type: params.type, expressionId: params.id } });

         // Assets remain immutable and accessible to messages and other users' collections.
         return status("No Content");
      },
      { params: t.Object({ type: t.Numeric({ minimum: 0, maximum: 1, multipleOf: 1 }), id: t.String({ minLength: 1, maxLength: 200 }) }) },
   );
}
