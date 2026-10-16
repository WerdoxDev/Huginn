import { prisma, type EmailVerification } from "@huginn/backend-shared/database";
import { CONSTANTS, snowflake, WorkerID, type EmailVerificationPurpose, type Snowflake } from "@huginnjs/shared";

import { generateSixDigitCode, hashVerificationCode } from "./verification-code";

export function generateEmailVerificationCode(): string {
   return generateSixDigitCode();
}

export function hashEmailVerificationCode(userId: Snowflake, code: string): string {
   return hashVerificationCode("email-verification", userId, code);
}

export async function issueEmailVerificationCode(userId: Snowflake, email: string, purpose: EmailVerificationPurpose): Promise<string> {
   const code = generateEmailVerificationCode();
   const codeHash = hashEmailVerificationCode(userId, code);
   const expiresAt = new Date(Date.now() + CONSTANTS.EMAIL_VERIFICATION_WINDOW);
   await prisma.emailVerification.upsert({
      where: { userId: BigInt(userId) },
      create: { id: snowflake.generate(WorkerID.EMAIL_VERIFICATION), userId: BigInt(userId), email, purpose, codeHash, expiresAt },
      update: { email, purpose, codeHash, expiresAt },
   });
   return code;
}

type ChallengeWhere = {
   id: bigint;
   userId: bigint;
   email: string;
   purpose: string;
   expiresAt: { equals: Date; gt: Date };
   codeHash: string;
};
type VerificationTransaction = {
   emailVerification: {
      deleteMany: (args: { where: ChallengeWhere }) => Promise<{ count: number }>;
   };
};

export async function consumeEmailVerificationCode(transaction: VerificationTransaction, verification: EmailVerification, code: string): Promise<boolean> {
   if (!/^\d{6}$/.test(code)) return false;
   const where = {
      id: verification.id,
      userId: verification.userId,
      email: verification.email,
      purpose: verification.purpose,
      expiresAt: { equals: verification.expiresAt, gt: new Date() },
      codeHash: hashEmailVerificationCode(verification.userId.toString(), code),
   };
   return (await transaction.emailVerification.deleteMany({ where })).count === 1;
}
