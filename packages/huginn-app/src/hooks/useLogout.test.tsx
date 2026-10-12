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
   useHuginnMutation: ({ mutationFn }: { mutationFn: () => Promise<void> }) => ({ mutateAsync: mutationFn }),
}));

describe("useLogout", () => {
   afterEach(() => {
      clientStore.setState({ client: undefined });
      navigate.mockClear();
   });

   it("navigates to login when the gateway resets during the logout request", async () => {
      let notifyReset: (() => void) | undefined;
      const gateway = {
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
});
