import type { Snowflake } from "@huginnjs/shared";

const CODE_COUNT = 1_000_000;
const UINT32_RANGE = 0x1_0000_0000;
const UNBIASED_LIMIT = UINT32_RANGE - (UINT32_RANGE % CODE_COUNT);

export function generateSixDigitCode(): string {
   const value = new Uint32Array(1);
   do {
      crypto.getRandomValues(value);
   } while (value[0]! >= UNBIASED_LIMIT);

   return (value[0]! % CODE_COUNT).toString().padStart(6, "0");
}

export function hashVerificationCode(scope: "password-reset" | "email-verification", userId: Snowflake, code: string): string {
   const secret = process.env.REFRESH_TOKEN_SECRET;
   if (!secret) throw new Error("REFRESH_TOKEN_SECRET is required for verification codes");

   return new Bun.CryptoHasher("sha256", secret).update(`${scope}:${userId}:${code}`).digest("hex");
}
