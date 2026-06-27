import { testHandler } from "@huginn/backend-shared";
import { getFileHash, resolveImage, toArrayBuffer, type APIPostApplicationIconJSONBody } from "@huginn/shared";
import { describe, expect, test } from "bun:test";
import pathe from "pathe";

import { env } from "#setup";
import { authHeader, createTestUsers, isCDNRunning } from "#tests/utils";

describe("POST /api/applications/icon", () => {
   test.skipIf(!isCDNRunning)("should upload an application's icon to cdn when request is successful", async () => {
      const [user] = await createTestUsers(1);

      const iconData = await resolveImage(pathe.resolve(__dirname, "../pixel.png"));
      const iconHash = getFileHash(toArrayBuffer(iconData!));

      await testHandler("/api/applications/icon", authHeader(user.accessToken), "POST", {
         icon: iconData,
         applicationId: undefined,
      } as APIPostApplicationIconJSONBody);

      const cdnIconData = await resolveImage(new URL(`/cdn/application-icons/${iconHash}.webp`, env.CDN_LOCAL_URL!).toString());
      expect(cdnIconData).toBeDefined();
   });
});
