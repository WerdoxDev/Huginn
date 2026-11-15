import { CONSTANTS } from "@huginnjs/shared";
import { timingSafeEqual } from "node:crypto";

export function signCdnPath(path: string, secret: string, expiresAt = Math.floor(Date.now() / 1000) + CONSTANTS.CDN_HMAC_EXPIRE_TIME) {
   const hasher = new Bun.CryptoHasher("sha256", secret);
   hasher.update(`${path}:${expiresAt}`);
   return `${path}?ex=${expiresAt}&hm=${hasher.digest("hex")}`;
}

export function verifyCdnSignature(path: string, expiresAt: number, signature: string, secret: string) {
   if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) || !/^[a-f0-9]{64}$/.test(signature)) return false;
   const hasher = new Bun.CryptoHasher("sha256", secret);
   hasher.update(`${path}:${expiresAt}`);
   return timingSafeEqual(Buffer.from(hasher.digest("hex"), "hex"), Buffer.from(signature, "hex"));
}
