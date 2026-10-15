import OTPInput from "@components/input/OTPInput";
import { useResendVerificationEmail } from "@hooks/mutations/useResendVerificationEmail";
import { useVerifyEmail } from "@hooks/mutations/useVerifyEmail";
import { useCountdown } from "@hooks/useCountdown";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { DialogActions, DialogBody, HuginnDialogPanel, HuginnDialogTitle, HuginnInput, HuginnLoadingButton } from "@huginn/frontend-shared";
import { CONSTANTS } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useEffect } from "react";

type Inputs = {
   verificationCode?: string;
};

export default function VerifyEmailModal() {
   const { verifyEmail: modal, updateModals } = useModals();
   const { register, handleSubmit, formState, handleErrors, setFocus } = useHuginnForm<Inputs>();
   const { countdown, startCountdown } = useCountdown();
   const verificationMutation = useVerifyEmail(async () => {
      updateModals({ verifyEmail: { isOpen: false, pendingEmail: null, onSuccess: undefined } });
      await modal.onSuccess?.();
   }, handleErrors);

   const resendMutation = useResendVerificationEmail(() => {
      setFocus("verificationCode");
      startCountdown(CONSTANTS.EMAIL_VERIFICATION_RESEND_COOLDOWN / 1000);
   }, handleErrors);

   useEffect(() => {
      if (modal.isOpen) {
         setFocus("verificationCode");
         startCountdown(CONSTANTS.EMAIL_VERIFICATION_RESEND_COOLDOWN / 1000);
      }
   }, [modal.isOpen, setFocus, startCountdown]);

   async function onSubmit(data: Inputs) {
      await verificationMutation.mutateAsync({
         code: data.verificationCode || "",
         email: modal.pendingEmail || "",
      });
   }

   async function onResend() {
      await resendMutation.mutateAsync();
   }

   return (
      <HuginnDialogPanel className="lg:max-w-sm">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title={"Verify Email"} />
               <div className="text-text/70">
                  We've sent a verification code to <span className="text-text">{modal.pendingEmail || "your email"}</span>
               </div>
               <HuginnInput {...register("verificationCode", { required: false })}>
                  <HuginnInput.Label>Verification Code</HuginnInput.Label>
                  <OTPInput />
               </HuginnInput>
            </DialogBody>
            <DialogActions>
               <HuginnLoadingButton
                  isLoading={resendMutation.isPending}
                  type="button"
                  color="surface"
                  onClick={onResend}
                  disabled={countdown > 0 || verificationMutation.isPending}
                  className="h-10 w-full"
               >
                  Resend code {countdown > 0 ? `(${countdown}s)` : ""}
               </HuginnLoadingButton>
               <HuginnLoadingButton isLoading={formState.isSubmitting} color="primary" className="h-10 w-full" type="submit">
                  Verify
               </HuginnLoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
