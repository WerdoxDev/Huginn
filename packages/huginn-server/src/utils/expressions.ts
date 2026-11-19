import { signCdnPath, verifyCdnSignature } from "@huginn/backend-shared/cdn-signature";
import { prisma } from "@huginn/backend-shared/database";
import {
   snowflake,
   WorkerID,
   ExpressionType,
   expressionPath,
   type APIExpression,
   type APIExpressionReference,
   type ExpressionKind,
   type RawFile,
} from "@huginnjs/shared";
import { t } from "elysia";

import { env } from "#setup";
import { fetchGifItems, fetchStickerItem, filterGifs } from "#utils/klipy";
import { cdnUpload } from "#utils/server-request";

import type { DBExpression } from "./types";

export const expressionReferenceSchema = t.Object({
   id: t.String({ minLength: 1, maxLength: 200, pattern: "^[a-zA-Z0-9_-]+$" }),
   type: t.Union([t.Literal(ExpressionType.KLIPY), t.Literal(ExpressionType.UPLOADED)]),
   ex: t.Optional(t.Integer({ minimum: 1 })),
   hm: t.Optional(t.String({ pattern: "^[a-f0-9]{64}$" })),
});

export const expressionListSchema = t.Optional(t.Array(expressionReferenceSchema, { minItems: 1 }));

export function expressionToAPI(kind: ExpressionKind, media: DBExpression): APIExpression {
   const result: APIExpression = {
      id: media.id,
      type: media.type as ExpressionType,
      title: media.title,
      url: media.url,
      src: media.src,
      width: media.width,
      height: media.height,
      contentType: media.contentType,
      sourceKey: media.sourceKey ?? undefined,
   };

   if (media.type === ExpressionType.UPLOADED) {
      const signed = signCdnPath(expressionPath(kind, media.id), env.CDN_HMAC_SECRET);
      const query = new URLSearchParams(signed.split("?")[1]);
      result.url = result.src = signed;
      result.ex = Number(query.get("ex"));
      result.hm = query.get("hm")!;
   }
   return result;
}

export async function resolveExpression(kind: ExpressionKind, ref: APIExpressionReference, verify = true): Promise<APIExpression | undefined> {
   if (ref.type !== ExpressionType.KLIPY && ref.type !== ExpressionType.UPLOADED) return;

   if (ref.type === ExpressionType.UPLOADED) {
      if (!/^[0-9]{1,20}$/.test(ref.id)) return;
      if (verify && (!ref.ex || !ref.hm || !verifyCdnSignature(expressionPath(kind, ref.id), ref.ex, ref.hm, env.CDN_HMAC_SECRET))) return;
   }

   const key = { kind, type: ref.type, id: ref.id };
   let expression = await prisma.expression.getById(key);

   if (!expression && ref.type === ExpressionType.KLIPY) {
      const media =
         kind === "gifs"
            ? filterGifs((await fetchGifItems([ref.id])).data, { quality: "md", format: "webm" }).find((item) => item.id === ref.id)
            : await fetchStickerItem(ref.id);
      if (!media || media.id !== ref.id) return;

      expression = await prisma.expression.createExpression({
         ...key,
         title: media.title,
         url: media.url,
         src: media.src,
         width: media.width,
         height: media.height,
         contentType: media.contentType,
      });
   }

   return expression ? expressionToAPI(kind, expression) : undefined;
}

export async function resolveExpressions(kind: ExpressionKind, refs: APIExpressionReference[] = [], verify = true) {
   const media = await Promise.all(refs.map((ref) => resolveExpression(kind, ref, verify)));
   return media.every((item) => !!item) ? (media as APIExpression[]) : undefined;
}

export async function expressionEmbeds(kind: ExpressionKind, refs: APIExpressionReference[]) {
   // Persisted references were verified on write. Never persist or trust an old signed URL.
   const media = await Promise.all(refs.map((ref) => resolveExpression(kind, ref, false)));
   return media.flatMap((item) =>
      item
         ? [
              {
                 type: kind === "gifs" ? "gif" : "sticker",
                 media: item,
                 url: item.url,
                 ...(item.contentType.startsWith("video/")
                    ? { video: { url: item.src, width: item.width, height: item.height } }
                    : { thumbnail: { url: item.src, width: item.width, height: item.height } }),
              },
           ]
         : [],
   );
}

export async function uploadExpression(kind: ExpressionKind, userId: string, file: RawFile, sourceKey?: string) {
   const id = snowflake.generate(kind === "gifs" ? WorkerID.GIF : WorkerID.STICKER).toString();
   const key = { kind, type: ExpressionType.UPLOADED, id };

   const existing = sourceKey ? await prisma.expression.getBySourceKey(sourceKey) : null;

   if (existing) {
      return expressionToAPI(kind, existing);
   }

   const uploaded = await cdnUpload<{ asset: string; width: number; height: number }>(`/${kind}/${id}`, { files: [file] });

   const expression = await prisma.expression.createExpression({
      ...key,
      title: file.name,
      url: uploaded.asset,
      src: uploaded.asset,
      width: uploaded.width,
      height: uploaded.height,
      contentType: kind === "gifs" ? "image/gif" : "image/webp",
      sourceKey: sourceKey,
   });

   await prisma.userExpression.createUserExpression(userId, kind, key);
   return expressionToAPI(kind, expression);
}
