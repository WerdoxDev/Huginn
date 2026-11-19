import type { ExpressionKind } from "@huginnjs/shared";

import Elysia from "elysia";

import { deleteUserExpression } from "./expression.delete";
import { getUserExpressions } from "./expression.get";
import { postUserExpression } from "./expression.post";
import { postExpressionUpload } from "./expression.upload.post";

function collectionRoutes<const Kind extends ExpressionKind>(kind: Kind) {
   return new Elysia().use(getUserExpressions(kind)).use(postUserExpression(kind)).use(deleteUserExpression(kind)).use(postExpressionUpload(kind));
}

export const expressionRoutes = new Elysia().use(collectionRoutes("gifs")).use(collectionRoutes("stickers"));
