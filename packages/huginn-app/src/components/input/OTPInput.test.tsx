import { useHuginnForm } from "@hooks/useHuginnForm";
import { HuginnInput } from "@huginn/frontend-shared";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OTPInput from "./OTPInput";

function CodeForm({ onSubmit = () => {} }: { onSubmit?: (data: { code: string }) => void }) {
   const { register, handleSubmit } = useHuginnForm<{ code: string }>();

   return (
      <form onSubmit={handleSubmit(onSubmit)}>
         <HuginnInput {...register("code", { required: true })}>
            <HuginnInput.Label>Email code</HuginnInput.Label>
            <OTPInput />
         </HuginnInput>
         <button type="submit">Continue</button>
      </form>
   );
}

describe("OTPInput", () => {
   it("does not show a required error until the empty form is submitted", async () => {
      render(<CodeForm />);
      await act(async () => {});

      expect(screen.queryByText("Required")).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await waitFor(() => expect(screen.getByText("Required")).toBeTruthy());
   });

   it("still sends entered digits to the form", async () => {
      const onSubmit = vi.fn();
      const { container } = render(<CodeForm onSubmit={onSubmit} />);
      const firstDigit = container.querySelectorAll("input")[1]!;

      fireEvent.change(firstDigit, { target: { value: "7" } });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ code: "7" }, expect.anything()));
   });
});
