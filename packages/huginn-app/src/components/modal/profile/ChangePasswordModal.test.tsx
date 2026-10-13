import type { ReactNode } from "react";

import { HuginnAPIError, JsonCode } from "@huginnjs/shared";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
   removePassword: false,
   mutateAsync: vi.fn(),
   startOAuth: vi.fn(),
   logout: vi.fn(),
   handleErrors: vi.fn(),
   updateModals: vi.fn(),
}));

vi.mock("@components/CautionInfo", () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock("@components/input/PasswordInput", () => {
   const PasswordInput = ({ children }: { children: ReactNode }) => children;
   PasswordInput.ToggleButton = () => null;
   return { default: PasswordInput };
});
vi.mock("@huginn/frontend-shared", () => {
   const Wrapper = ({ children }: { children: ReactNode }) => children;
   const HuginnInput = Object.assign(Wrapper, {
      Label: Wrapper,
      Wrapper,
      Input: () => <input />,
   });
   return {
      DialogActions: Wrapper,
      DialogBody: Wrapper,
      HuginnDialogPanel: Wrapper,
      HuginnDialogTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
      HuginnInput,
      HuginnLoadingButton: ({ children, type }: { children: ReactNode; type: "submit" }) => <button type={type}>{children}</button>,
   };
});
vi.mock("@hooks/useHuginnForm", () => ({
   useHuginnForm: () => ({
      register: () => ({}),
      handleSubmit: (callback: (data: { newPassword: string }) => Promise<void>) => (event: Event) => {
         event.preventDefault();
         return callback({ newPassword: "new-password" });
      },
      formState: { isSubmitting: false },
      handleErrors: mocks.handleErrors,
      setFocus: vi.fn(),
   }),
}));
vi.mock("@hooks/mutations/usePatchUser", () => ({
   usePatchUser: (_onSuccess: unknown, onError: (error: { code: number; message: string }) => void) => ({
      mutateAsync: async (body: unknown) => {
         try {
            return await mocks.mutateAsync(body);
         } catch (error) {
            if (error instanceof HuginnAPIError) onError(error.rawError);
            throw error;
         }
      },
   }),
}));
vi.mock("@hooks/useIsOAuth", () => ({ useIsOAuth: () => true }));
vi.mock("@hooks/useLogout", () => ({ useLogout: () => mocks.logout }));
vi.mock("@hooks/useOAuth", () => ({ useOAuth: () => mocks.startOAuth }));
vi.mock("@stores/modalsStore", () => ({
   useModals: () => ({ changePassword: { isOpen: true, removePassword: mocks.removePassword }, updateModals: mocks.updateModals }),
}));
vi.mock("@stores/userStore", () => ({ useThisUser: () => ({ tokenPayload: { authType: "oauth", authProvider: "google" } }) }));
vi.mock("@tanstack/react-query", () => ({
   useQueryClient: () => ({ getQueryData: () => ({ password: { configured: true } }), invalidateQueries: vi.fn() }),
}));

import ChangePasswordModal from "./ChangePasswordModal";

function reauthenticationError() {
   const rawError = { code: JsonCode.REAUTHENTICATION_REQUIRED, message: "Recent authentication required" };
   return new HuginnAPIError(rawError, rawError.code, 403, "PATCH", "/api/users/@me", {});
}

function submit() {
   const { container } = render(<ChangePasswordModal />);
   fireEvent.submit(container.querySelector("form")!);
}

describe("ChangePasswordModal reauthentication", () => {
   beforeEach(() => {
      mocks.removePassword = false;
      mocks.mutateAsync.mockReset();
      mocks.startOAuth.mockReset();
      mocks.logout.mockReset();
      mocks.handleErrors.mockReset();
      mocks.updateModals.mockReset();
      mocks.logout.mockResolvedValue(undefined);
   });

   it("retries setting a password only after a completed OAuth handoff", async () => {
      mocks.mutateAsync.mockRejectedValueOnce(reauthenticationError()).mockResolvedValueOnce(undefined);
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });

      submit();
      await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(2));
      expect(mocks.mutateAsync).toHaveBeenNthCalledWith(1, { newPassword: "new-password", password: undefined });
      expect(mocks.mutateAsync).toHaveBeenNthCalledWith(2, { newPassword: "new-password", password: undefined });
      expect(mocks.startOAuth).toHaveBeenCalledWith("google", { reauthenticationFor: "set or change your password" });
      expect(mocks.logout).not.toHaveBeenCalled();
   });

   it("does not retry or log out when reauthentication is cancelled", async () => {
      mocks.removePassword = true;
      mocks.mutateAsync.mockRejectedValueOnce(reauthenticationError());
      mocks.startOAuth.mockResolvedValue({ error: "CANCELLED" });

      submit();
      await waitFor(() => expect(mocks.startOAuth).toHaveBeenCalledTimes(1));
      expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
      expect(mocks.logout).not.toHaveBeenCalled();
   });

   it("logs out after a successful removal retry", async () => {
      mocks.removePassword = true;
      mocks.mutateAsync.mockRejectedValueOnce(reauthenticationError()).mockResolvedValueOnce(undefined);
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });

      submit();
      await waitFor(() => expect(mocks.logout).toHaveBeenCalledTimes(1));
      expect(mocks.mutateAsync).toHaveBeenNthCalledWith(2, { newPassword: null, password: undefined });
   });

   it("shows an error and keeps the account open if the retry is still stale", async () => {
      mocks.removePassword = true;
      mocks.mutateAsync.mockRejectedValue(reauthenticationError());
      mocks.startOAuth.mockResolvedValue({ handoff_code: "valid-handoff" });

      submit();
      await waitFor(() => expect(mocks.handleErrors).toHaveBeenCalledWith(expect.objectContaining({ code: JsonCode.REAUTHENTICATION_REQUIRED })));
      expect(mocks.mutateAsync).toHaveBeenCalledTimes(2);
      expect(mocks.logout).not.toHaveBeenCalled();
   });
});
