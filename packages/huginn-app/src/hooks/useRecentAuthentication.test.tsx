import { CONSTANTS, HuginnAPIError, JsonCode } from "@huginnjs/shared";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
   startOAuth: vi.fn(),
   authType: "oauth",
   lastAuthenticatedAt: 0,
}));

vi.mock("./useOAuth", () => ({ useOAuth: () => mocks.startOAuth }));
vi.mock("@stores/userStore", () => ({
   useThisUser: () => ({
      tokenPayload: {
         authType: mocks.authType,
         authProvider: mocks.authType === "oauth" ? "google" : undefined,
         lastAuthenticatedAt: mocks.lastAuthenticatedAt,
      },
   }),
}));

import { useRecentAuthentication } from "./useRecentAuthentication";

function reauthenticationError() {
   const rawError = { code: JsonCode.REAUTHENTICATION_REQUIRED, message: "Recent authentication required" };
   return new HuginnAPIError(rawError, rawError.code, 403, "PATCH", "/api/users/@me", {});
}

describe("useRecentAuthentication", () => {
   beforeEach(() => {
      mocks.startOAuth.mockReset();
      mocks.authType = "oauth";
      mocks.lastAuthenticatedAt = Date.now();
   });

   it("retries an action once after completing OAuth reauthentication", async () => {
      const action = vi.fn().mockRejectedValueOnce(reauthenticationError()).mockResolvedValueOnce("connected");
      const openedWindow = {} as Window;
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });
      const { result } = renderHook(() => useRecentAuthentication());

      await expect(result.current.run(action, { reason: "connect Google to your account", openedWindow })).resolves.toEqual({
         value: "connected",
      });
      expect(action).toHaveBeenCalledTimes(2);
      expect(mocks.startOAuth).toHaveBeenCalledExactlyOnceWith("google", {
         reauthenticationFor: "connect Google to your account",
         openedWindow,
      });
   });

   it("returns without retrying when OAuth is cancelled", async () => {
      const action = vi.fn().mockRejectedValueOnce(reauthenticationError());
      mocks.startOAuth.mockResolvedValue(null);
      const { result } = renderHook(() => useRecentAuthentication());

      await expect(result.current.run(action, { reason: "disconnect Google from your account" })).resolves.toBeNull();
      expect(action).toHaveBeenCalledTimes(1);
   });

   it("shows a second reauthentication error through the mutation handler", async () => {
      const error = reauthenticationError();
      const showError = vi.fn();
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });
      const { result } = renderHook(() => useRecentAuthentication());
      const action = vi.fn().mockImplementation(async () => {
         result.current.handleMutationError(error.rawError, showError);
         throw error;
      });

      await expect(result.current.run(action, { reason: "set your password" })).rejects.toBe(error);
      expect(action).toHaveBeenCalledTimes(2);
      expect(mocks.startOAuth).toHaveBeenCalledTimes(1);
      expect(showError).toHaveBeenCalledOnce();
   });

   it("authenticates first when the session is stale and never loops on another challenge", async () => {
      mocks.lastAuthenticatedAt = Date.now() - CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW - 1;
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });
      const action = vi.fn().mockRejectedValue(reauthenticationError());
      const { result } = renderHook(() => useRecentAuthentication());

      await expect(result.current.run(action, { reason: "remove your password", authenticateIfStale: true })).rejects.toBeInstanceOf(
         HuginnAPIError,
      );
      expect(mocks.startOAuth).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledTimes(1);
   });
});
