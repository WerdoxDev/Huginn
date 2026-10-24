import { useModals } from "@stores/modalsStore";

type PasswordModal = "changeUsername" | "changeEmail" | "changePassword" | "connectedAccountPassword";

export default function ResetPasswordButton(props: { from?: PasswordModal; suggestedEmail?: string }) {
   const { updateModals } = useModals();

   function handleClick() {
      updateModals({
         [props.from ?? "changePassword"]: { isOpen: false },
         passwordReset: { isOpen: true, mode: props.from ? "authenticated" : "login", suggestedEmail: props.suggestedEmail },
      });
   }

   return (
      <button type="button" className="text-primary-500 mt-2 cursor-pointer text-left text-sm hover:underline" onClick={handleClick}>
         Forgot your password?
      </button>
   );
}
