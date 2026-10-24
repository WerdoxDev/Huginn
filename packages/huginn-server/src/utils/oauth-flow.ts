import { createSHA265Hash, createToken, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CDNRoutes, CONSTANTS, getFileHash, OAuthCode, type OAuthFlow, type OAuthProvider, snowflake, WorkerID, toSnakeCase } from "@huginnjs/shared";
import { t } from "elysia";
import { randomBytes } from "node:crypto";

import { env } from "#setup";
import { createOAuthHandoff } from "#utils/oauth-handoff";
import { isActiveOAuthLinkSession } from "#utils/oauth-link";
import { cdnUpload } from "#utils/server-request";

export const oauthStartQuerySchema = t.Object({
   flow: t.Union([t.Literal("browser"), t.Literal("desktop")]),
   redirect_url: t.String(),
   link_token: t.Optional(t.String()),
});

export const oauthCallbackQuerySchema = t.Object({
   code: t.Optional(t.String()),
   error: t.Optional(t.String()),
   state: t.Optional(t.String()),
   iss: t.Optional(t.String()),
   scope: t.Optional(t.String()),
   authuser: t.Optional(t.String()),
   prompt: t.Optional(t.String()),
});

export const oauthCookieSchema = t.Cookie({
   oauth: t.Object({
      provider: t.Union([t.Literal("google"), t.Literal("github")]),
      state: t.String(),
      codeVerifier: t.String(),
      flow: t.Union([t.Literal("browser"), t.Literal("desktop")]),
      origin: t.String(),
      redirect_url: t.String(),
      link: t.Nullable(t.Optional(t.Object({ userId: t.String(), sessionId: t.String() }))),
   }),
});

export type OAuthCookie = {
   provider: OAuthProvider;
   state: string;
   codeVerifier: string;
   flow: OAuthFlow;
   origin: string;
   redirect_url: string;
   link: { userId: string; sessionId: string } | null;
};

export type OAuthUser = {
   id: string;
   email: string;
   name: string;
   picture?: string | null;
   accountIdentifier: string;
};

export function oauthRedirectUrl(redirectUrl: string, flow: OAuthFlow, params: Record<string, string>): string {
   const destination = new URL(redirectUrl);
   destination.search = new URLSearchParams({ flow, ...params }).toString();
   return destination.toString();
}

export async function prepareOAuthAuthorization(options: {
   provider: OAuthProvider;
   flow: OAuthFlow;
   redirectUrl: string;
   linkToken?: string;
   requestUrl: string;
   clientId: string;
   authorizeUrl: string;
   scope: string;
}): Promise<{ kind: "forbidden" } | { kind: "redirect"; url: string; cookie?: OAuthCookie }> {
   const { provider, flow, redirectUrl, linkToken, requestUrl, clientId, authorizeUrl, scope } = options;
   let destination: URL;
   try {
      destination = new URL(redirectUrl);
   } catch {
      return { kind: "forbidden" };
   }
   const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((value) => new URL(value.trim()).origin);
   if (!["http:", "https:"].includes(destination.protocol) || !allowedOrigins.includes(destination.origin) || destination.username || destination.password) {
      return { kind: "forbidden" };
   }

   let link: OAuthCookie["link"] = null;
   if (linkToken !== undefined) {
      const { valid, payload } = await verifyToken("oauth-link", linkToken);
      if (
         !valid ||
         !payload ||
         payload.purpose !== `connect-${provider}` ||
         !payload.userId ||
         !payload.sessionId ||
         !(await isActiveOAuthLinkSession(payload.userId, payload.sessionId))
      ) {
         destination.searchParams.delete("connected");
         destination.searchParams.set("flow", flow);
         destination.searchParams.set("error", OAuthCode.LINK_EXPIRED);
         return { kind: "redirect", url: destination.toString() };
      }
      link = { userId: payload.userId, sessionId: payload.sessionId };
   }

   const request = new URL(requestUrl);
   const origin = request.origin;
   const state = randomBytes(32).toString("base64url");
   const codeVerifier = randomBytes(32).toString("base64url");
   const endpoint = new URL(authorizeUrl);
   endpoint.searchParams.set("client_id", clientId);
   endpoint.searchParams.set("redirect_uri", `${origin}/api/auth/callback/${provider}`);
   endpoint.searchParams.set("response_type", "code");
   endpoint.searchParams.set("state", state);
   endpoint.searchParams.set("code_challenge", createSHA265Hash(codeVerifier, "base64url"));
   endpoint.searchParams.set("code_challenge_method", "S256");
   endpoint.searchParams.set("scope", scope);
   return {
      kind: "redirect",
      url: endpoint.toString(),
      cookie: { provider, state, codeVerifier, flow, origin, redirect_url: redirectUrl, link },
   };
}

export async function completeOAuth(provider: OAuthProvider, user: OAuthUser, link: OAuthCookie["link"]): Promise<Record<string, string>> {
   const identityProvider = await prisma.identityProvider.findUnique({
      where: { providerType_providerUserId: { providerType: provider, providerUserId: user.id } },
   });
   if (link) {
      if (!(await isActiveOAuthLinkSession(link.userId, link.sessionId))) return { error: OAuthCode.LINK_EXPIRED };
      if (identityProvider?.completed && identityProvider.userId !== BigInt(link.userId)) return { error: OAuthCode.ACCOUNT_ALREADY_CONNECTED };
      const currentProvider = await prisma.identityProvider.findFirst({
         where: { userId: BigInt(link.userId), providerType: provider, completed: true },
      });
      if (currentProvider && currentProvider.providerUserId !== user.id) return { error: OAuthCode.PROVIDER_ALREADY_CONNECTED };
      if (!identityProvider) {
         await prisma.identityProvider.create({
            data: {
               id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
               providerType: provider,
               providerUserId: user.id,
               accountIdentifier: user.accountIdentifier,
               userId: BigInt(link.userId),
               completed: true,
            },
         });
      } else if (!identityProvider.completed) {
         const updated = await prisma.identityProvider.updateMany({
            where: { id: identityProvider.id, completed: false },
            data: { userId: BigInt(link.userId), completed: true, accountIdentifier: user.accountIdentifier },
         });
         if (!updated.count) return { error: OAuthCode.ACCOUNT_ALREADY_CONNECTED };
      } else {
         await prisma.identityProvider.update({ where: { id: identityProvider.id }, data: { accountIdentifier: user.accountIdentifier } });
      }
      return { connected: provider };
   }
   if (identityProvider?.completed && identityProvider.userId) {
      await prisma.identityProvider.update({ where: { id: identityProvider.id }, data: { accountIdentifier: user.accountIdentifier } });
      // Both providers require a verified email in their callbacks. Repair older
      // accounts only when that email still matches the user's current email.
      await prisma.user.updateMany({
         where: { id: identityProvider.userId, email: { equals: user.email, mode: "insensitive" }, emailVerifiedAt: null },
         data: { emailVerifiedAt: new Date() },
      });
      return { handoff_code: await createOAuthHandoff(identityProvider.userId.toString(), provider) };
   }
   if (await prisma.user.exists({ email: user.email })) return { error: OAuthCode.ACCOUNT_ALREADY_CONNECTED };
   const upserted = await prisma.identityProvider.upsert({
      where: { providerType_providerUserId: { providerType: provider, providerUserId: user.id } },
      create: {
         id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
         providerType: provider,
         providerUserId: user.id,
         accountIdentifier: user.accountIdentifier,
         completed: false,
      },
      update: { accountIdentifier: user.accountIdentifier },
   });
   let avatarHash: string | null = null;
   if (user.picture) {
      const avatarData = await (await fetch(user.picture)).arrayBuffer();
      avatarHash = getFileHash(avatarData);
      avatarHash = (await cdnUpload<string>(CDNRoutes.uploadAvatar(user.id), { files: [{ data: avatarData, name: avatarHash }] })).split(".")[0];
   }
   const token = await createToken(
      "oauth",
      {
         providerId: upserted.id.toString(),
         providerUserId: upserted.providerUserId,
         email: user.email,
         username: toSnakeCase(user.name),
         fullName: user.name,
         avatarHash,
      },
      CONSTANTS.OAUTH_TOKEN_EXPIRE_TIME,
   );
   return { oauth_token: token };
}
