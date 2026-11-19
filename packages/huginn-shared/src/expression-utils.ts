import { ExpressionType, type APIExpression, type APIExpressionReference, type ExpressionKind } from "./api-types";

export function expressionReference({ id, type, ex, hm }: APIExpressionReference): APIExpressionReference {
   return { id, type, ...(type === ExpressionType.UPLOADED && { ex, hm }) };
}

export function resolveExpression(media: Partial<APIExpression>): APIExpressionReference | undefined {
   if (media.id && media.type !== undefined) return { id: media.id, type: media.type, ex: media.ex, hm: media.hm };

   if (media.url) {
      try {
         const url = new URL(media.url);
         if (url.origin === "https://klipy.com" && url.pathname.startsWith("/gifs/")) {
            return { id: url.pathname.split("/").filter(Boolean).at(-1)!, type: ExpressionType.KLIPY };
         }
      } catch {}
   }

   return undefined;
}

export function expressionPath(kind: ExpressionKind, id: string): string {
   return `${kind}/${id}.${kind === "gifs" ? "gif" : "webp"}`;
}
