import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import HuginnInput from "@components/input/HuginnInput";
import OTPInput from "@components/input/OTPInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useResendVerificationEmail } from "@hooks/mutations/useResendVerificationEmail";
import { useVerifyEmail } from "@hooks/mutations/useVerifyEmail";
import { useCountdown } from "@hooks/useCountdown";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useOAuth } from "@hooks/useOAuth";
import { JsonCode, type OAuthType, type HuginnErrorData, constants } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useEffect, useState } from "react";

import HuginnDialogPanel from "../HuginnDialogPanel";

type Inputs = {
   email: string;
   password?: string;
   verificationCode?: string;
};

export default function ChangeEmailModal() {
   const { tokenPayload } = useThisUser();
   const { register, handleSubmit, formState, handleErrors, setFocus } = useHuginnForm<Inputs>();
   const { updateModals, changeEmail: modal } = useModals();
   const [isVerifying, setIsVerifying] = useState(false);
   const [pendingEmail, setPendingEmail] = useState<string | null>(null);
   const { countdown, startCountdown } = useCountdown();

   const patchMutation = usePatchUser(() => {
      setIsVerifying(true);
      setFocus("verificationCode");
   }, onError);

   const verificationMutation = useVerifyEmail(() => {
      updateModals({ changeEmail: { isOpen: false } });
   }, handleErrors);

   const resendMutation = useResendVerificationEmail(() => {
      setFocus("verificationCode");
   });

   const canResend = countdown === 0;

   const startOAuth = useOAuth();

   const isOAuth = tokenPayload?.authType === "github" || tokenPayload?.authType === "google";

   useEffect(() => {
      if (modal.isOpen) {
         setIsVerifying(false);
         setFocus(isVerifying ? "verificationCode" : "email");
      }
   }, [modal]);

   async function onSubmit(data: Inputs) {
      if (isVerifying) {
         await verificationMutation.mutateAsync({ code: data.verificationCode || "" });
      } else {
         const result = await patchMutation.mutateAsync({
            email: data.email,
            password: data.password,
         });
         setPendingEmail(result?.pendingEmail ?? null);
         startCountdown(constants.EMAIL_VERIFICATION_RESEND_COOLDOWN / 1000);
      }
   }

   async function onResend() {
      await resendMutation.mutateAsync();
   }

   async function onError(error: HuginnErrorData) {
      if (error.code === JsonCode.REAUTHENTICATION_REQUIRED) {
         const result = await startOAuth(tokenPayload?.authType as OAuthType);
         if (result) await handleSubmit(onSubmit)();
      } else handleErrors(error);
   }

   return (
      <HuginnDialogPanel className="w-full max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title={isVerifying ? "Verify Email" : "Change Email"} />
               {!isVerifying ? (
                  <>
                     <HuginnInput {...register("email", { required: true })}>
                        <HuginnInput.Label>New Email</HuginnInput.Label>
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input />
                        </HuginnInput.Wrapper>
                     </HuginnInput>
                     {!isOAuth && (
                        <HuginnInput {...register("password", { required: true })} type="password">
                           <HuginnInput.Label>Password</HuginnInput.Label>
                           <HuginnInput.Wrapper>
                              <HuginnInput.Input />
                           </HuginnInput.Wrapper>
                        </HuginnInput>
                     )}
                  </>
               ) : (
                  <>
                     <div className="text-text/80">
                        We've sent a verification code to <span className="text-text font-semibold">{pendingEmail}</span>
                     </div>
                     <HuginnInput {...register("verificationCode", { required: false })}>
                        <HuginnInput.Label>Verification Code</HuginnInput.Label>
                        <OTPInput />
                     </HuginnInput>
                  </>
               )}
            </DialogBody>
            <DialogActions>
               {isVerifying && (
                  <LoadingButton
                     isLoading={resendMutation.isPending}
                     type="button"
                     color="surface"
                     onClick={onResend}
                     disabled={!canResend || patchMutation.isPending}
                     className="h-10 w-full"
                  >
                     Resend Code {!canResend && <span className="text-sm text-white/80">({countdown}s)</span>}
                  </LoadingButton>
               )}
               <LoadingButton
                  isLoading={isVerifying ? verificationMutation.isPending : formState.isSubmitting}
                  color="primary"
                  className="h-10 w-full"
                  type="submit"
               >
                  {isVerifying ? "Verify" : "Save"}
               </LoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
