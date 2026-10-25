import type { ReactNode } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
   mode: "authenticated" as "authenticated" | "login",
   requestPasswordReset: vi.fn().mockResolvedValue(undefined),
   confirmPasswordReset: vi.fn(),
   setValue: vi.fn(),
   reset: vi.fn(),
   updateModals: vi.fn(),
}));

vi.mock("@components/input/OTPInput", () => ({ default: () => <input /> }));
vi.mock("@components/input/PasswordInput", () => {
   const PasswordInput = ({ children }: { children: ReactNode }) => children;
   PasswordInput.ToggleButton = () => null;
   return { default: PasswordInput };
});
vi.mock("@huginn/frontend-shared", () => {
   const Wrapper = ({ children }: { children: ReactNode }) => <div>{children}</div>;
   const HuginnInput = Object.assign(Wrapper, {
      Label: ({ children }: { children: ReactNode }) => <label>{children}</label>,
      Wrapper,
      Input: () => <input />,
   });
   return {
      DialogActions: Wrapper,
      DialogBody: Wrapper,
      HuginnButton: ({ children }: { children: ReactNode }) => <button>{children}</button>,
      HuginnDialogPanel: Wrapper,
      HuginnDialogTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
      HuginnInput,
      HuginnLoadingButton: ({ children }: { children: ReactNode }) => <button>{children}</button>,
   };
});
vi.mock("@hooks/useCountdown", () => ({ useCountdown: () => ({ countdown: 0, startCountdown: vi.fn() }) }));
vi.mock("@hooks/useHuginnForm", () => ({
   useHuginnForm: () => ({
      register: () => ({}),
      unregister: vi.fn(),
      handleSubmit: (submit: (data: { email: string; code: string; newPassword: string }) => unknown) => (event: Event) => {
         event.preventDefault();
         return submit({ email: "member@example.com", code: "123456", newPassword: "new-password" });
      },
      handleErrors: vi.fn(),
      formState: { isSubmitting: false },
      getValues: () => "member@example.com",
      reset: mocks.reset,
      setError: vi.fn(),
      setValue: mocks.setValue,
   }),
}));
vi.mock("@hooks/useHuginnMutation", () => ({
   useHuginnMutation: (options: { mutationFn: (input: unknown) => Promise<unknown>; onSuccess?: (result: unknown) => void }) => ({
      mutateAsync: async (input: unknown) => {
         const result = await options.mutationFn(input);
         options.onSuccess?.(result);
         return result;
      },
      mutate: vi.fn(),
      isPending: false,
   }),
}));
vi.mock("@stores/clientStore", () => ({
   useClient: () => ({ auth: mocks }),
}));
vi.mock("@stores/modalsStore", () => ({
   useModals: () => ({ passwordReset: { isOpen: true, mode: mocks.mode, suggestedEmail: "" }, updateModals: mocks.updateModals }),
}));
vi.mock("@stores/userStore", () => ({ useThisUser: () => ({ user: { email: "member@example.com" } }) }));

import PasswordResetModal from "./PasswordResetModal";

describe("PasswordResetModal", () => {
   beforeEach(() => {
      mocks.mode = "authenticated";
      mocks.requestPasswordReset.mockClear();
      mocks.confirmPasswordReset.mockReset().mockResolvedValue(undefined);
      mocks.setValue.mockClear();
      mocks.updateModals.mockClear();
   });

   it("requests a code for the signed-in account and skips the email step", async () => {
      render(<PasswordResetModal />);

      await waitFor(() => expect(mocks.requestPasswordReset).toHaveBeenCalledWith({ email: "member@example.com" }));
      expect(mocks.requestPasswordReset).toHaveBeenCalledOnce();
      expect(mocks.setValue).toHaveBeenCalledWith("email", "member@example.com");
      expect(screen.getByText(/Enter the code sent to/)).toBeTruthy();
      expect(screen.getByText("member@example.com")).toBeTruthy();
      expect(screen.queryByText("Email")).toBeNull();
   });

   it("completes an authenticated reset without signing out", async () => {
      const { container } = render(<PasswordResetModal />);
      await waitFor(() => expect(mocks.requestPasswordReset).toHaveBeenCalledOnce());

      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() =>
         expect(mocks.confirmPasswordReset).toHaveBeenCalledWith({ email: "member@example.com", code: "123456", newPassword: "new-password" }, true),
      );
      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({ info: expect.objectContaining({ text: "Your password has been changed." }) }),
      );
   });

   it("uses the same request method after entering an email while logged out", async () => {
      mocks.mode = "login";
      const { container } = render(<PasswordResetModal />);

      expect(screen.getByText("Email")).toBeTruthy();
      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() => expect(mocks.requestPasswordReset).toHaveBeenCalledWith({ email: "member@example.com" }));
      expect(mocks.requestPasswordReset).toHaveBeenCalledOnce();
      expect(mocks.setValue).not.toHaveBeenCalled();

      await waitFor(() => expect(screen.getByText("Reset code")).toBeTruthy());
      fireEvent.submit(container.querySelector("form")!);
      await waitFor(() =>
         expect(mocks.confirmPasswordReset).toHaveBeenCalledWith({ email: "member@example.com", code: "123456", newPassword: "new-password" }, false),
      );
   });
});
