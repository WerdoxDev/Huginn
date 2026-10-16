import { prisma } from "@huginn/backend-shared/database";
import { CONSTANTS, snowflake, WorkerID, type Snowflake } from "@huginnjs/shared";

import { generateSixDigitCode, hashVerificationCode } from "./verification-code";

export function generatePasswordResetCode(): string {
   return generateSixDigitCode();
}

export function hashPasswordResetCode(userId: Snowflake, code: string): string {
   return hashVerificationCode("password-reset", userId, code);
}

export async function issuePasswordResetCode(userId: Snowflake): Promise<string> {
   const code = generatePasswordResetCode();
   const codeHash = hashPasswordResetCode(userId, code);
   const expiresAt = new Date(Date.now() + CONSTANTS.PASSWORD_RESET_WINDOW);
   await prisma.passwordReset.upsert({
      where: { userId: BigInt(userId) },
      create: { id: snowflake.generate(WorkerID.PASSWORD_RESET), userId: BigInt(userId), codeHash, expiresAt },
      update: { codeHash, expiresAt },
   });
   return code;
}

type ChallengeWhere = { userId: bigint; expiresAt: { gt: Date }; codeHash: string };
type ResetTransaction = {
   passwordReset: {
      deleteMany: (args: { where: ChallengeWhere }) => Promise<{ count: number }>;
   };
};

export async function consumePasswordResetCode(transaction: ResetTransaction, userId: Snowflake, code: string): Promise<boolean> {
   if (!/^\d{6}$/.test(code)) return false;
   const now = new Date();
   const where = { userId: BigInt(userId), expiresAt: { gt: now }, codeHash: hashPasswordResetCode(userId, code) };
   return (await transaction.passwordReset.deleteMany({ where })).count === 1;
}
