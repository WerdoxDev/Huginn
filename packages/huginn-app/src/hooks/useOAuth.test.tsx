import { act, renderHook } from "@testing-library/react";
import { UnsecuredJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
   client: undefined as unknown,
   updateModals: vi.fn(),
   capture: vi.fn(),
}));

vi.mock("@lib/event-handler", () => ({ listenEvent: () => () => {} }));
vi.mock("@stores/clientStore", () => ({ useClient: () => mocks.client }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals: mocks.updateModals }) }));
vi.mock("@stores/windowStore", () => ({ useHuginnWindow: () => ({ environment: "browser" }) }));
vi.mock("posthog-js/react", () => ({ usePostHog: () => ({ capture: mocks.capture }) }));

import { useOAuth } from "./useOAuth";

function createClient(returnedUserId: string) {
   return {
      currentUser: { id: "user-1" },
      oauth: {
         getOAuthURL: vi.fn().mockReturnValue("https://example.test/oauth"),
         exchangeHandoff: vi.fn().mockResolvedValue({
            token: new UnsecuredJWT({ id: returnedUserId }).encode(),
            refreshToken: "new-refresh",
         }),
      },
      tokenHandler: {
         token: "old-access",
         refreshToken: "old-refresh",
         setTokens(tokens: { token: string; refreshToken: string }) {
            this.token = tokens.token;
            this.refreshToken = tokens.refreshToken;
         },
      },
   };
}

async function completeHandoff(reauthenticationFor?: string) {
   localStorage.setItem("oauth-confirm", JSON.stringify({ flow: "browser", handoff_code: "one-time-code" }));
   const { result } = renderHook(() => useOAuth());
   const pending = result.current("google", reauthenticationFor ? { reauthenticationFor } : undefined);
   await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
   });
   return pending;
}

describe("useOAuth handoff", () => {
   beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(window, "open").mockReturnValue(null);
      mocks.updateModals.mockReset();
      mocks.capture.mockReset();
   });

   afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
      localStorage.clear();
   });

   it("keeps the current tokens when the Google account belongs to another user", async () => {
      const client = createClient("user-2");
      mocks.client = client;

      expect(await completeHandoff()).toBeNull();
      expect(client.oauth.exchangeHandoff).toHaveBeenCalledWith("one-time-code");
      expect(client.tokenHandler).toMatchObject({ token: "old-access", refreshToken: "old-refresh" });
      expect(mocks.updateModals).toHaveBeenCalledWith(expect.objectContaining({ info: expect.objectContaining({ title: "Wrong account" }) }));
   });

   it("updates both tokens when the user matches", async () => {
      const client = createClient("user-1");
      mocks.client = client;

      expect(await completeHandoff()).toMatchObject({ handoff_code: "one-time-code" });
      expect(client.tokenHandler.token).toBe(new UnsecuredJWT({ id: "user-1" }).encode());
      expect(client.tokenHandler.refreshToken).toBe("new-refresh");
   });

   it("explains the pending action during reauthentication", async () => {
      mocks.client = createClient("user-1");

      await completeHandoff("remove your password");

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({
               title: "Confirm your identity",
               text: expect.stringContaining("remove your password"),
            }),
         }),
      );
   });

   it("keeps the reauthentication explanation visible until the user finishes or cancels", async () => {
      mocks.client = createClient("user-1");
      const { result } = renderHook(() => useOAuth());
      const pending = result.current("google", { reauthenticationFor: "remove your password" });
      const prompt = mocks.updateModals.mock.calls.find(([value]) => value.info?.title === "Confirm your identity")?.[0].info;

      await act(async () => {
         await vi.advanceTimersByTimeAsync(1000);
      });
      expect(mocks.updateModals).not.toHaveBeenCalledWith({ info: { isOpen: false } });
      expect(prompt.text).toContain("remove your password");
      expect(prompt.text).toContain("Return to Huginn");

      prompt.action.cancel.callback();
      await act(async () => {
         await vi.advanceTimersByTimeAsync(500);
      });
      await expect(pending).resolves.toBeNull();
   });
});
