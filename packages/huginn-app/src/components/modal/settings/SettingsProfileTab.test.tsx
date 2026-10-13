import type { ReactNode } from "react";

import { CONSTANTS, HuginnAPIError, JsonCode } from "@huginnjs/shared";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
   isOAuth: true,
   lastAuthenticatedAt: 0,
   updateModals: vi.fn(),
   startOAuth: vi.fn(),
   mutateAsync: vi.fn(),
   logout: vi.fn(),
}));

vi.mock("@components/button/ImagePickerButtons", () => ({ ImagePickerDeleteButton: () => null, ImagePickerEditButton: () => null }));
vi.mock("@components/ColorPicker", () => ({ default: () => null }));
vi.mock("@components/MemberSince", () => ({ default: () => null }));
vi.mock("@components/profile/ProfileComponents", () => ({ ProfileAboutMe: () => null, ProfileActivity: () => null }));
vi.mock("@components/RoamingHuginnIcon", () => ({ default: () => null }));
vi.mock("@components/tooltip/Tooltip", () => ({ default: () => null }));
vi.mock("@components/UserAvatar", () => ({ default: () => null }));
vi.mock("@components/UserBanner", () => ({ default: () => null }));
vi.mock("@huginn/frontend-shared", () => ({
   HuginnButton: ({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) => (
      <button onClick={onClick} disabled={disabled}>
         {children}
      </button>
   ),
   HuginnLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@hooks/mutations/usePatchUser", () => ({ usePatchUser: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }) }));
vi.mock("@hooks/useFileDialog", () => ({ useFileDialog: () => ({ openFileDialog: vi.fn() }) }));
vi.mock("@hooks/useIsOAuth", () => ({ useIsOAuth: () => mocks.isOAuth }));
vi.mock("@hooks/useLogout", () => ({ useLogout: () => mocks.logout }));
vi.mock("@hooks/useOAuth", () => ({ useOAuth: () => mocks.startOAuth }));
vi.mock("@lib/queries", () => ({ getAuthMethodsOptions: () => ({ queryKey: ["auth-methods"] }) }));
vi.mock("@stores/clientStore", () => ({ useClient: () => ({}) }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals: mocks.updateModals }) }));
vi.mock("@stores/userStore", () => ({
   useThisUser: () => ({
      user: { id: "user-1", username: "test", displayName: "Test", email: "test@example.com", avatar: null, banner: null, bio: null },
      tokenPayload: { authType: "oauth", authProvider: "google", lastAuthenticatedAt: mocks.lastAuthenticatedAt },
   }),
}));
vi.mock("@tanstack/react-query", () => ({
   useQuery: () => ({ data: { password: { configured: true }, providers: [{ type: "google", connected: true, available: true }] } }),
}));

import SettingsProfileTab from "./SettingsProfileTab";

async function confirmRemoval() {
   render(<SettingsProfileTab />);
   fireEvent.click(screen.getByRole("button", { name: "Remove" }));
   const confirmation = mocks.updateModals.mock.calls.find(([value]) => value.info?.action?.confirm)?.[0].info.action.confirm.callback;
   expect(confirmation).toBeTypeOf("function");
   await act(async () => {
      await confirmation();
   });
}

describe("SettingsProfileTab password removal", () => {
   beforeEach(() => {
      mocks.isOAuth = true;
      mocks.lastAuthenticatedAt = Date.now() - CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW - 1000;
      mocks.updateModals.mockReset();
      mocks.startOAuth.mockReset();
      mocks.mutateAsync.mockReset();
      mocks.logout.mockReset();
      mocks.logout.mockResolvedValue(undefined);
   });

   it("starts OAuth reauthentication before removing a password from a stale OAuth session", async () => {
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });
      mocks.mutateAsync.mockResolvedValue(undefined);

      await confirmRemoval();

      expect(mocks.startOAuth).toHaveBeenCalledWith("google", { reauthenticationFor: "remove your password" });
      expect(mocks.mutateAsync).toHaveBeenCalledWith({ newPassword: null });
      expect(mocks.startOAuth.mock.invocationCallOrder[0]).toBeLessThan(mocks.mutateAsync.mock.invocationCallOrder[0]);
      expect(mocks.logout).toHaveBeenCalledTimes(1);
   });

   it("reauthenticates and retries when the server says a recent session is required", async () => {
      mocks.lastAuthenticatedAt = Date.now();
      const rawError = { code: JsonCode.REAUTHENTICATION_REQUIRED, message: "Recent authentication required" };
      mocks.mutateAsync
         .mockRejectedValueOnce(new HuginnAPIError(rawError, rawError.code, 403, "PATCH", "/api/users/@me", {}))
         .mockResolvedValueOnce(undefined);
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });

      await confirmRemoval();

      expect(mocks.startOAuth).toHaveBeenCalledTimes(1);
      expect(mocks.startOAuth.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.mutateAsync.mock.invocationCallOrder[0]);
      expect(mocks.mutateAsync).toHaveBeenCalledTimes(2);
      expect(mocks.logout).toHaveBeenCalledTimes(1);
   });

   it("leaves the password in place when reauthentication is cancelled", async () => {
      mocks.startOAuth.mockResolvedValue(null);

      await confirmRemoval();

      expect(mocks.startOAuth).toHaveBeenCalledTimes(1);
      expect(mocks.mutateAsync).not.toHaveBeenCalled();
      expect(mocks.logout).not.toHaveBeenCalled();
   });

   it("opens password confirmation for password sessions", async () => {
      mocks.isOAuth = false;

      await confirmRemoval();

      expect(mocks.updateModals).toHaveBeenCalledWith({ info: { isOpen: false }, changePassword: { isOpen: true, removePassword: true } });
      expect(mocks.startOAuth).not.toHaveBeenCalled();
      expect(mocks.mutateAsync).not.toHaveBeenCalled();
   });
});
