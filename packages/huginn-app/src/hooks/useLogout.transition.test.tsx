import type { AnyRouter } from "@tanstack/react-router";

import { HuginnClient } from "@huginnjs/api";
import { clientStore, initializeClient } from "@stores/clientStore";
import { modalsStore, useModals } from "@stores/modalsStore";
import { userStore, useThisUser } from "@stores/userStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLogout } from "./useLogout";

// Keep session handling and routing real, without starting desktop voice services.
vi.mock("@lib/voice/voice-bridge", async () => ({ VoiceBridge: (await import("@huginnjs/api")).Voice }));

let router: AnyRouter;
vi.mock("@/router", () => ({
   get router() {
      return router;
   },
}));

const signedInUser = { id: "1", username: "alice" } as NonNullable<ReturnType<typeof userStore.getState>["user"]>;
const originalTransition = Object.getOwnPropertyDescriptor(document, "startViewTransition");

function OutgoingPage({ onLogout }: { onLogout: (result: Promise<void>) => void }) {
   const logout = useLogout();
   const { user } = useThisUser();
   const { settings } = useModals();

   return (
      <main style={{ viewTransitionName: "main" }}>
         <p>Channel contents</p>
         {user && <p>Signed in as {user.username}</p>}
         {settings.isOpen && <aside>Settings</aside>}
         <button onClick={() => onLogout(logout())}>Log out</button>
      </main>
   );
}

describe("logout view transition", () => {
   let unlisten: (() => void) | undefined;
   let queryClient: QueryClient;
   let client: NonNullable<ReturnType<typeof clientStore.getState>["client"]>;
   let logoutResult: Promise<void>;
   let snapshots: Array<{ text: string | null; username: string | undefined; types: string[] }>;

   beforeEach(async () => {
      clientStore.setState({ client: undefined, isLoggingOut: false });
      vi.spyOn(HuginnClient.prototype, "connect").mockResolvedValue(true);
      unlisten = await initializeClient();
      client = clientStore.getState().client!;
      vi.spyOn(client.gateway, "connect").mockResolvedValue(true);
      vi.spyOn(client.gateway, "isConnected", "get").mockReturnValue(true);
      userStore.setState({ user: signedInUser });
      modalsStore.getState().updateModals({ settings: { isOpen: true } });

      snapshots = [];
      vi.stubGlobal("CSS", { ...window.CSS, supports: () => true });
      Object.defineProperty(document, "startViewTransition", {
         configurable: true,
         value: vi.fn((options: (() => Promise<void>) | { update: () => Promise<void>; types: string[] }) => {
            // Native transitions capture the old document before running the update callback.
            const updateCallbackDone = Promise.resolve().then(async () => {
               snapshots.push({
                  text: document.querySelector("main")?.textContent ?? null,
                  username: userStore.getState().user?.username,
                  types: typeof options === "function" ? [] : options.types,
               });
               await (typeof options === "function" ? options() : options.update());
            });
            return { updateCallbackDone, ready: updateCallbackDone, finished: updateCallbackDone };
         }),
      });

      const root = createRootRoute({ component: Outlet });
      const main = createRoute({
         getParentRoute: () => root,
         path: "/channels/@me",
         component: () => <OutgoingPage onLogout={(result) => (logoutResult = result)} />,
      });
      const login = createRoute({ getParentRoute: () => root, path: "/login", component: () => <p>Login page</p> });
      router = createRouter({
         routeTree: root.addChildren([main, login]),
         history: createMemoryHistory({ initialEntries: ["/channels/@me"] }),
         defaultPendingMs: 0,
         defaultPendingMinMs: 0,
      });
      queryClient = new QueryClient();
      render(
         <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
         </QueryClientProvider>,
      );
      await screen.findByRole("button", { name: "Log out" });
   });

   afterEach(() => {
      cleanup();
      unlisten?.();
      queryClient.clear();
      clientStore.setState({ client: undefined, isLoggingOut: false });
      userStore.setState(userStore.getInitialState(), true);
      modalsStore.setState(modalsStore.getInitialState(), true);
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      if (originalTransition) Object.defineProperty(document, "startViewTransition", originalTransition);
      else Reflect.deleteProperty(document, "startViewTransition");
   });

   it("captures the outgoing page when revocation arrives before the logout response", async () => {
      const response = Promise.withResolvers<void>();
      const request = vi.spyOn(client.auth, "logout").mockImplementation(async () => {
         client.gateway.reset();
         client.gateway.emit("session_revoked", undefined);
         await response.promise;
      });

      fireEvent.click(screen.getByRole("button", { name: "Log out" }));
      await waitFor(() => expect(request).toHaveBeenCalledOnce());
      expect(screen.getByText("Signed in as alice")).toBeTruthy();
      expect(screen.queryByText("Login page")).toBeNull();
      expect(snapshots).toEqual([]);

      await act(async () => {
         response.resolve();
         await logoutResult;
      });

      expect(snapshots).toEqual([{ text: "Channel contentsSigned in as aliceSettingsLog out", username: "alice", types: ["backwards"] }]);
      expect(screen.getByText("Login page")).toBeTruthy();
      expect(userStore.getState().user).toBeUndefined();
      expect(modalsStore.getState().settings.isOpen).toBe(false);
   });

   it("captures the outgoing page when revocation arrives while waiting for the gateway reset", async () => {
      vi.spyOn(client.auth, "logout").mockResolvedValue(undefined);
      const close = vi.spyOn(client.gateway, "close");
      fireEvent.click(screen.getByRole("button", { name: "Log out" }));
      await waitFor(() => expect(close).toHaveBeenCalled());

      await act(async () => {
         client.gateway.reset();
         client.gateway.emit("session_revoked", undefined);
         await logoutResult;
      });

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].text).toContain("Channel contentsSigned in as alice");
      expect(snapshots[0].types).toEqual(["backwards"]);
      expect(screen.getByText("Login page")).toBeTruthy();
   });

   it("keeps user and modal content until capture when logout has no revocation event", async () => {
      vi.spyOn(client.gateway, "isConnected", "get").mockReturnValue(false);
      vi.spyOn(client.auth, "logout").mockResolvedValue(undefined);

      await act(async () => {
         fireEvent.click(screen.getByRole("button", { name: "Log out" }));
         await logoutResult;
      });

      expect(snapshots).toEqual([{ text: "Channel contentsSigned in as aliceSettingsLog out", username: "alice", types: ["backwards"] }]);
      expect(userStore.getState().user).toBeUndefined();
      expect(modalsStore.getState().settings.isOpen).toBe(false);
   });

   it("clears the session after a navigation failure and allows logout to be retried", async () => {
      vi.spyOn(client.gateway, "isConnected", "get").mockReturnValue(false);
      vi.spyOn(client.auth, "logout").mockResolvedValue(undefined);
      const error = new Error("Navigation failed");
      const navigate = vi.spyOn(router, "navigate").mockRejectedValueOnce(error);
      client.tokenHandler.setTokens({ token: "access", refreshToken: "refresh" });

      await act(async () => {
         fireEvent.click(screen.getByRole("button", { name: "Log out" }));
         await expect(logoutResult).rejects.toThrow(error);
      });
      expect(userStore.getState().user).toBeUndefined();
      expect(modalsStore.getState().settings.isOpen).toBe(false);
      expect(localStorage.getItem("access-token")).toBeNull();
      expect(localStorage.getItem("refresh-token")).toBeNull();

      await act(async () => {
         fireEvent.click(screen.getByRole("button", { name: "Log out" }));
         await logoutResult;
      });
      expect(navigate).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Login page")).toBeTruthy();
   });

   it("still returns to login when the session is revoked outside an explicit logout", async () => {
      client.tokenHandler.setTokens({ token: "access", refreshToken: "refresh" });

      await act(async () => {
         client.gateway.reset();
         client.gateway.emit("session_revoked", undefined);
      });

      await screen.findByText("Login page");
      expect(userStore.getState().user).toBeUndefined();
      expect(localStorage.getItem("access-token")).toBeNull();
      expect(localStorage.getItem("refresh-token")).toBeNull();
      expect(client.tokenHandler.token).toBeUndefined();
   });
});
