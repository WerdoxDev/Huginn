import type { APIPostExpressionUploadResult, ExpressionKind } from "@huginnjs/shared";

import { invalidBody, singleError, verifyJwt } from "@huginn/backend-shared";
import { CONSTANTS, Errors } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { uploadExpression } from "#utils/expressions";

const schema = t.Object({ files: t.Array(t.File(), { minItems: 1, maxItems: 1 }), sourceKey: t.Optional(t.String()) });

export function postExpressionUpload<const Kind extends ExpressionKind>(kind: Kind) {
   const maxBytes = kind === "gifs" ? CONSTANTS.GIF_MAX_BYTES : CONSTANTS.STICKER_MAX_BYTES;
   return new Elysia().use(verifyJwt()).post(
      `/api/users/@me/${kind}/upload`,
      async ({ tokenPayload, body, status }) => {
         const file = body.files[0];

         if (!file.size) return invalidBody(status);
         if (file.size > maxBytes) return singleError(Errors.fileTooLarge(file.size, maxBytes), status, "Bad Request");

         const expression = await uploadExpression(kind, tokenPayload.id, { data: await file.arrayBuffer(), name: file.name }, body.sourceKey);
         const json: APIPostExpressionUploadResult = expression;
         return status("Created", json);
      },
      { body: schema },
   );
}
