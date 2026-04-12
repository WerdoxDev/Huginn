import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import HuginnInput from "@components/input/HuginnInput";
import OTPInput from "@components/input/OTPInput";
import { useResendVerificationEmail } from "@hooks/mutations/useResendVerificationEmail";
import { useVerifyEmail } from "@hooks/mutations/useVerifyEmail";
import { useCountdown } from "@hooks/useCountdown";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { CONSTANTS } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useEffect } from "react";

import HuginnDialogPanel from "../HuginnDialogPanel";

type Inputs = {
   verificationCode?: string;
};

export default function VerifyEmailModal() {
   const { verifyEmail: modal, updateModals } = useModals();
   const { register, handleSubmit, formState, handleErrors, setFocus } = useHuginnForm<Inputs>();
   const { countdown, startCountdown } = useCountdown();

   const canResend = countdown === 0;

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
      <HuginnDialogPanel className="w-full max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title={"Verify Email"} />
               <div className="text-text/80">
                  We've sent a verification code to <span className="text-text font-semibold">{modal.pendingEmail || "your email"}</span>
               </div>
               <HuginnInput {...register("verificationCode", { required: false })}>
                  <HuginnInput.Label>Verification Code</HuginnInput.Label>
                  <OTPInput />
               </HuginnInput>
            </DialogBody>
            <DialogActions>
               <LoadingButton
                  isLoading={resendMutation.isPending}
                  type="button"
                  color="surface"
                  onClick={onResend}
                  disabled={!canResend || verificationMutation.isPending}
                  className="h-10 w-full"
               >
                  Resend Code {!canResend && <span className="text-sm text-white/80">({countdown}s)</span>}
               </LoadingButton>
               <LoadingButton isLoading={formState.isSubmitting} color="primary" className="h-10 w-52" type="submit">
                  Verify
               </LoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
