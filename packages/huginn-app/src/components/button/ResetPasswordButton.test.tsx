import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const updateModals = vi.hoisted(() => vi.fn());

vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals }) }));

import ResetPasswordButton from "./ResetPasswordButton";

describe("ResetPasswordButton", () => {
   it.each(["changeUsername", "changeEmail", "changePassword", "connectedAccountPassword"] as const)(
      "opens the shared reset modal from %s without asking for an email",
      (from) => {
         updateModals.mockClear();
         render(<ResetPasswordButton from={from} />);

         fireEvent.click(screen.getByRole("button", { name: "Forgot your password?" }));

         expect(updateModals).toHaveBeenCalledWith({
            [from]: { isOpen: false },
            passwordReset: { isOpen: true, mode: "authenticated", suggestedEmail: undefined },
         });
      },
   );
});
