import { createToken, testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type OAuthProvider, snowflake, WorkerID } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers, removeUserLater } from "#tests/utils";
import { completeOAuth } from "#utils/oauth-flow";

const migration = new URL("../../../../huginn-backend-shared/prisma/migrations/20261024000000_verify_legacy_oauth_emails/migration.sql", import.meta.url);

describe("OAuth email verification", () => {
   for (const provider of ["google", "github"] as const satisfies readonly OAuthProvider[]) {
      test(`${provider} repairs a legacy account before adding a password and signing in`, async () => {
         const [user] = await createTestUsers(1);
         await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: null, password: null } });
         const identity = await prisma.identityProvider.create({
            data: {
               id: snowflake.generate(WorkerID.TESTING),
               userId: user.id,
               providerType: provider,
               providerUserId: `${provider}-${user.id}`,
               completed: true,
            },
         });
         try {
            const result = await completeOAuth(
               provider,
               { id: identity.providerUserId, email: user.email.toUpperCase(), name: user.username, accountIdentifier: user.email },
               null,
            );
            expect(result.handoff_code).toBeString();
            expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt).toBeInstanceOf(Date);

            const session = (await testHandler("/api/auth/oauth-handoff", {}, "POST", { code: result.handoff_code })) as { token: string };
            await testHandler("/api/users/@me", authHeader(session.token), "PATCH", { newPassword: "oauth-password-123" });
            const response = (await testHandler("/api/auth/login", {}, "POST", { email: user.email, password: "oauth-password-123" }, true)) as Response;
            expect(response.status).toBe(200);
            expect((await response.json()).token).toBeString();
            expect(await prisma.emailVerification.findUnique({ where: { userId: user.id } })).toBeNull();
         } finally {
            await prisma.identityProvider.delete({ where: { id: identity.id } });
         }
      });

      test(`${provider} does not verify a different Huginn email or overwrite existing verification`, async () => {
         const [user] = await createTestUsers(1);
         const verifiedAt = new Date("2026-01-01T00:00:00.000Z");
         const identity = await prisma.identityProvider.create({
            data: {
               id: snowflake.generate(WorkerID.TESTING),
               userId: user.id,
               providerType: provider,
               providerUserId: `${provider}-${user.id}`,
               completed: true,
            },
         });
         try {
            await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: null } });
            await completeOAuth(
               provider,
               { id: identity.providerUserId, email: "different@example.com", name: user.username, accountIdentifier: "different" },
               null,
            );
            expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt).toBeNull();

            await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: verifiedAt } });
            await completeOAuth(provider, { id: identity.providerUserId, email: user.email, name: user.username, accountIdentifier: user.email }, null);
            expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt).toEqual(verifiedAt);
         } finally {
            await prisma.identityProvider.delete({ where: { id: identity.id } });
         }
      });

      test(`${provider} signup persists email verification`, async () => {
         const identity = await prisma.identityProvider.create({
            data: {
               id: snowflake.generate(WorkerID.TESTING),
               providerType: provider,
               providerUserId: `new-${provider}-${snowflake.generateString(WorkerID.TESTING)}`,
               completed: false,
            },
         });
         const username = `oauth_${identity.id.toString(36)}`;
         try {
            const token = await createToken(
               "oauth",
               {
                  providerId: identity.id.toString(),
                  providerUserId: identity.providerUserId,
                  email: `${identity.id}@example.com`,
                  username,
                  fullName: "OAuth user",
                  avatarHash: null,
               },
               "5m",
            );
            const user = (await testHandler("/api/auth/oauth-confirm", authHeader(token), "POST", {
               username,
               displayName: "OAuth user",
               avatar: null,
            })) as { id: string };
            removeUserLater(user);
            const stored = await prisma.user.findUniqueOrThrow({ where: { id: BigInt(user.id) } });
            expect(stored.emailVerifiedAt).toBeInstanceOf(Date);
            expect(stored.password).toBeNull();
         } finally {
            await prisma.identityProvider.delete({ where: { id: identity.id } });
         }
      });
   }

   test("migration verifies only completed Google identities matching the current email", async () => {
      const sql = await Bun.file(migration).text();
      await prisma.$transaction(async (tx) => {
         // Temporary tables shadow the real tables only within this transaction.
         await tx.$executeRawUnsafe('CREATE TEMP TABLE "User" ("id" BIGINT, "email" TEXT, "emailVerifiedAt" TIMESTAMP(3)) ON COMMIT DROP');
         await tx.$executeRawUnsafe(
            'CREATE TEMP TABLE "IdentityProvider" ("userId" BIGINT, "providerType" TEXT, "completed" BOOLEAN, "accountIdentifier" TEXT) ON COMMIT DROP',
         );
         await tx.$executeRawUnsafe(`INSERT INTO "User" VALUES
            (1, 'match@example.com', NULL), (2, 'different@example.com', NULL),
            (3, 'incomplete@example.com', NULL), (4, 'password@example.com', NULL),
            (5, 'verified@example.com', '2026-01-01'), (6, 'github@example.com', NULL), (7, 'missing@example.com', NULL)`);
         await tx.$executeRawUnsafe(`INSERT INTO "IdentityProvider" VALUES
            (1, 'google', true, 'MATCH@example.com'), (2, 'google', true, 'old@example.com'),
            (3, 'google', false, 'incomplete@example.com'), (5, 'google', true, 'verified@example.com'),
            (6, 'github', true, 'github@example.com'), (7, 'google', true, NULL)`);
         await tx.$executeRawUnsafe(sql);
         const first = await tx.$queryRawUnsafe<{ id: bigint; emailVerifiedAt: Date | null }[]>('SELECT "id", "emailVerifiedAt" FROM "User" ORDER BY "id"');
         expect(first[0]?.emailVerifiedAt).toBeInstanceOf(Date);
         expect(first[4]?.emailVerifiedAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));
         for (const index of [1, 2, 3, 5, 6]) expect(first[index]?.emailVerifiedAt).toBeNull();

         await tx.$executeRawUnsafe(sql);
         expect(await tx.$queryRawUnsafe<{ id: bigint; emailVerifiedAt: Date | null }[]>('SELECT "id", "emailVerifiedAt" FROM "User" ORDER BY "id"')).toEqual(
            first,
         );
      });
   });
});
