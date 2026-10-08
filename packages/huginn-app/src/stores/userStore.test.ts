import type { GatewayReadyData } from "@huginnjs/shared";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestUser } from "@/test-utils";

import { clientStore } from "./clientStoreState";
import { clearUserStore, initUserStore, userStore } from "./userStore";

describe("userStore", () => {
   beforeEach(() => {
      clearUserStore();
      clientStore.setState({ client: undefined });
   });

   it("replaces the current user when a new client becomes ready", () => {
      const listeners = new Map<string, (data: unknown) => void>();
      const client = {
         gateway: {
            listen: vi.fn((event: string, listener: (data: unknown) => void) => {
               listeners.set(event, listener);
               return vi.fn();
            }),
         },
         tokenHandler: {
            token: "eyJhbGciOiJub25lIn0.eyJpZCI6Im5ldy11c2VyIiwiYXV0aFR5cGUiOiJwYXNzd29yZCIsImxhc3RBdXRoZW50aWNhdGVkQXQiOjF9.",
         },
      };
      const previousUser = createTestUser({ id: "previous-user" });
      const nextUser = createTestUser({ id: "new-user" });

      userStore.getState().setUser(previousUser);
      clientStore.setState({ client: client as never });
      const cleanup = initUserStore();

      listeners.get("ready")?.({ user: nextUser } as GatewayReadyData);

      expect(userStore.getState().user?.id).toBe("new-user");
      expect(userStore.getState().tokenPayload?.id).toBe("new-user");
      cleanup?.();
   });

   it("clears user data while switching instances", () => {
      userStore.getState().setUser(createTestUser({ id: "previous-user" }));
      userStore.setState({ tokenPayload: { id: "previous-user", authType: "password", lastAuthenticatedAt: 1 } });

      clearUserStore();

      expect(userStore.getState().user).toBeUndefined();
      expect(userStore.getState().tokenPayload).toBeUndefined();
   });
});
