import type { APIPostOAuthHandoffResult } from "@huginnjs/shared";

import { unauthorized } from "@huginn/backend-shared";
import Elysia, { t } from "elysia";

import { createAuthSession } from "#utils/auth-session";
import { consumeOAuthHandoff } from "#utils/oauth-handoff";

export const postOAuthHandoff = new Elysia().post(
   "/api/auth/oauth-handoff",
   async ({ body, request, set, status }) => {
      set.headers["Cache-Control"] = "no-store";
      const userId = await consumeOAuthHandoff(body.code);
      if (!userId) return unauthorized(status);
      const result: APIPostOAuthHandoffResult = await createAuthSession(userId, "oauth", "google", request.headers.get("user-agent") ?? undefined);
      return status("OK", result);
   },
   { body: t.Object({ code: t.String() }) },
);
