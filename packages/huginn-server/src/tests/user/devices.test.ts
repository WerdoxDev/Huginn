import type { APIGetDevicesResult } from "@huginnjs/shared";

import { testHandler, verifyToken } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";

import { createTestUsers, authHeader } from "#tests/utils";
import { createAuthSession } from "#utils/auth-session";

describe("/users/@me/devices", () => {
   test("lists only the user's active sessions and identifies the current device", async () => {
      const [user, otherUser] = await createTestUsers(2);
      const second = await createAuthSession(user.id.toString(), "password", "Second device");

      const devices = (await testHandler("/api/users/@me/devices", authHeader(user.accessToken), "GET")) as APIGetDevicesResult;
      expect(devices).toHaveLength(2);
      expect(devices.filter((device) => device.current)).toHaveLength(1);
      expect(devices.find((device) => device.current)?.userAgent).toBe("Huginn test client");
      expect(devices.every((device) => device.authType === "password")).toBe(true);

      const otherDevices = (await testHandler("/api/users/@me/devices", authHeader(otherUser.accessToken), "GET")) as APIGetDevicesResult;
      expect(otherDevices).toHaveLength(1);
      expect(devices.map((device) => device.id)).not.toContain(otherDevices[0].id);
      expect((await verifyToken("user-access", second.token)).valid).toBe(true);
   });

   test("can revoke an owned device but cannot revoke another user's device", async () => {
      const [user, otherUser] = await createTestUsers(2);
      const second = await createAuthSession(user.id.toString(), "password", "Second device");
      const secondDevices = (await testHandler("/api/users/@me/devices", authHeader(second.token), "GET")) as APIGetDevicesResult;
      const secondId = secondDevices.find((device) => device.current)!.id;
      const otherDevices = (await testHandler("/api/users/@me/devices", authHeader(otherUser.accessToken), "GET")) as APIGetDevicesResult;

      expect(testHandler(`/api/users/@me/devices/${otherDevices[0].id}`, authHeader(user.accessToken), "DELETE")).rejects.toThrow();

      const response = (await testHandler(`/api/users/@me/devices/${secondId}`, authHeader(user.accessToken), "DELETE", undefined, true)) as Response;
      expect(response.status).toBe(204);
      expect((await verifyToken("user-access", second.token)).valid).toBe(false);
      expect(testHandler("/api/auth/refresh-token", {}, "POST", { refreshToken: second.refreshToken })).rejects.toThrow("Unauthorized");
      expect((await verifyToken("user-access", user.accessToken)).valid).toBe(true);
   });
});
