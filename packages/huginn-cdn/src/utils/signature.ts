import { verifyCdnSignature } from "@huginn/backend-shared/cdn-signature";
import { env, t } from "elysia";

export const signatureQuery = {
   hm: t.String(),
   ex: t.Number(),
};

export function hasValidSignature(path: string, query: { ex: number; hm: string }) {
   try {
      return verifyCdnSignature(decodeURIComponent(path.replace(/^\/cdn\//, "")), query.ex, query.hm, env.CDN_HMAC_SECRET!);
   } catch {
      return false;
   }
}
