import { clientStore } from "@stores/clientStore";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLogout } from "./useLogout";

const navigate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@tanstack/react-router")>()),
   useNavigate: () => navigate,
}));

vi.mock("./useHuginnMutation", () => ({
   useHuginnMutation: ({ mutationFn }: { mutationFn: (options: { alreadyRevoked?: boolean }) => Promise<void> }) => ({ mutateAsync: mutationFn }),
}));

describe("useLogout", () => {
   afterEach(() => {
      clientStore.setState({ client: undefined });
      navigate.mockClear();
   });

   it("navigates to login when the gateway resets during the logout request", async () => {
      let notifyReset: (() => void) | undefined;
      const gateway = {
         isConnected: true,
         waitForAnyEvents: vi.fn(
            () =>
               new Promise<{ event: "reset"; data: undefined }>((resolve) => {
                  notifyReset = () => resolve({ event: "reset", data: undefined });
               }),
         ),
         connect: vi.fn().mockResolvedValue(true),
      };
      const client = {
         gateway,
         voice: { status: "idle" },
         logout: vi.fn(async () => {
            notifyReset?.();
         }),
      };
      clientStore.setState({ client: client as unknown as ReturnType<typeof clientStore.getState>["client"] });
      const { result } = renderHook(() => useLogout());
      const logout = result.current();

      await vi.waitFor(() =>
         expect(navigate).toHaveBeenCalledWith({ to: "/login", replace: true, viewTransition: { types: ["backwards"] } }),
      );
      await logout;

      expect(gateway.waitForAnyEvents).toHaveBeenCalledWith(["reset"]);
      expect(client.logout).toHaveBeenCalledOnce();
      expect(gateway.connect).toHaveBeenCalledOnce();
   });

   it("clears an already revoked session without another logout request or gateway reset wait", async () => {
      const gateway = {
         isConnected: true,
         waitForAnyEvents: vi.fn(),
         connect: vi.fn(),
      };
      const client = {
         gateway,
         voice: { status: "connected" },
         voiceManager: { disconnectVoice: vi.fn().mockRejectedValue(new Error("voice already disconnected")) },
         logout: vi.fn(),
         clearSessionLocally: vi.fn(),
      };
      clientStore.setState({ client: client as unknown as ReturnType<typeof clientStore.getState>["client"] });
      const { result } = renderHook(() => useLogout());

      await result.current({ alreadyRevoked: true });

      expect(client.clearSessionLocally).toHaveBeenCalledOnce();
      expect(client.voiceManager.disconnectVoice).toHaveBeenCalledOnce();
      expect(client.logout).not.toHaveBeenCalled();
      expect(gateway.waitForAnyEvents).not.toHaveBeenCalled();
      expect(gateway.connect).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith({ to: "/login", replace: true, viewTransition: { types: ["backwards"] } });
   });

   it("does not wait for a gateway reset when the gateway is already disconnected", async () => {
      const gateway = {
         isConnected: false,
         waitForAnyEvents: vi.fn(),
         connect: vi.fn(),
      };
      const client = {
         gateway,
         voice: { status: "idle" },
         logout: vi.fn(),
      };
      clientStore.setState({ client: client as unknown as ReturnType<typeof clientStore.getState>["client"] });
      const { result } = renderHook(() => useLogout());

      await result.current();

      expect(client.logout).toHaveBeenCalledOnce();
      expect(gateway.waitForAnyEvents).not.toHaveBeenCalled();
      expect(gateway.connect).not.toHaveBeenCalled();
   });
});
