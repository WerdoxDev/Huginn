import type { APIGetUserExpressionsResult, ExpressionKind } from "@huginnjs/shared";

import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia from "elysia";

import { expressionToAPI } from "#utils/expressions";

export function getUserExpressions<const Kind extends ExpressionKind>(kind: Kind) {
   return new Elysia().use(verifyJwt()).get(`/api/users/@me/${kind}`, async ({ tokenPayload, set, status }) => {
      set.headers["Cache-Control"] = "private, no-store";
      const items = await prisma.userExpression.findMany({
         where: { userId: BigInt(tokenPayload.id), kind },
         include: { expression: true },
         orderBy: [{ usageCount: "desc" }, { lastUsedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }, { expressionId: "asc" }],
      });

      const json: APIGetUserExpressionsResult = items.map((item) => ({
         ...expressionToAPI(kind, item.expression),
         usageCount: item.usageCount,
         lastUsedAt: item.lastUsedAt?.toISOString() ?? null,
      }));

      return status("OK", json);
   });
}
