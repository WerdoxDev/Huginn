import { createSHA265Hash } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CONSTANTS, type Snowflake } from "@huginnjs/shared";
import { randomBytes } from "node:crypto";

export async function createOAuthHandoff(userId: Snowflake): Promise<string> {
   const code = randomBytes(32).toString("base64url");
   await prisma.oAuthHandoff.deleteMany({ where: { expiresAt: { lte: new Date() } } });
   await prisma.oAuthHandoff.create({
      data: { codeHash: createSHA265Hash(code), userId: BigInt(userId), expiresAt: new Date(Date.now() + CONSTANTS.OAUTH_HANDOFF_EXPIRE_TIME_MS) },
   });
   return code;
}

export async function consumeOAuthHandoff(code: string): Promise<Snowflake | null> {
   if (!/^[A-Za-z0-9_-]{43}$/.test(code)) return null;

   // query written as raw because prisma does not support returning deleted rows yet
   const rows = await prisma.$queryRaw<{ userId: bigint }[]>`
      DELETE FROM "OAuthHandoff"
      WHERE "codeHash" = ${createSHA265Hash(code)} AND "expiresAt" > NOW()
      RETURNING "userId"
   `;
   return rows[0]?.userId.toString() ?? null;
}
