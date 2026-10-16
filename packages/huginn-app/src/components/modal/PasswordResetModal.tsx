import OTPInput from "@components/input/OTPInput";
import PasswordInput from "@components/input/PasswordInput";
import { useCountdown } from "@hooks/useCountdown";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import {
   DialogActions,
   DialogBody,
   HuginnButton,
   HuginnDialogPanel,
   HuginnDialogTitle,
   HuginnInput,
   HuginnLoadingButton,
} from "@huginn/frontend-shared";
import { CONSTANTS, JsonCode } from "@huginnjs/shared";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useEffect, useRef, useState } from "react";

type Inputs = { email: string; code: string; newPassword: string; confirmPassword: string };

export default function PasswordResetModal() {
   const client = useClient();
   const { passwordReset, updateModals } = useModals();
   const { user } = useThisUser();
   const automaticRequestStarted = useRef(false);
   const authenticated = passwordReset.mode === "authenticated";
   const [step, setStep] = useState<"email" | "code">(authenticated ? "code" : "email");
   const { register, unregister, handleSubmit, handleErrors, formState, getValues, reset, setError, setValue } = useHuginnForm<Inputs>();
   const { countdown, startCountdown } = useCountdown();

   useEffect(() => {
      if (passwordReset.isOpen) {
         setStep(authenticated ? "code" : "email");
         reset({ email: authenticated ? (user?.email ?? "") : passwordReset.suggestedEmail, code: "", newPassword: "" });
      } else {
         automaticRequestStarted.current = false;
      }
   }, [passwordReset.isOpen, passwordReset.mode, passwordReset.suggestedEmail]);

   useEffect(() => {
      if (step === "email") unregister(["code", "newPassword"]);
   }, [step, unregister]);

   const requestMutation = useHuginnMutation(
      {
         mutationFn: (email: string) => client!.auth.requestPasswordReset({ email }),
         onSuccess() {
            setStep("code");
            startCountdown(CONSTANTS.PASSWORD_RESET_RESEND_COOLDOWN / 1000);
         },
      },
      handleErrors,
   );
   const confirmMutation = useHuginnMutation(
      {
         mutationFn: ({ email, code, newPassword }: Inputs) => client!.auth.confirmPasswordReset({ email, code, newPassword }, authenticated),
         onSuccess() {
            updateModals({
               passwordReset: { isOpen: false },
               info: {
                  isOpen: true,
                  status: "success",
                  title: "Password changed",
                  text: authenticated ? "Your password has been changed." : "You can now sign in with your new password.",
               },
            });
         },
      },
      (error) => {
         if (error.code === JsonCode.PASSWORD_RESET_INVALID) {
            setError("code", { type: "validate", message: error.message });
            return true;
         }
         return handleErrors(error);
      },
   );

   useEffect(() => {
      if (!passwordReset.isOpen || !authenticated || automaticRequestStarted.current || !user?.email) return;
      automaticRequestStarted.current = true;
      setValue("email", user.email);
      void requestMutation.mutateAsync(user.email).catch(() => {
         // The mutation displays the request error in the form.
      });
   }, [passwordReset.isOpen, authenticated, user?.email]);

   async function onSubmit(data: Inputs) {
      try {
         if (step === "email" && !authenticated) await requestMutation.mutateAsync(data.email);
         else await confirmMutation.mutateAsync(data);
      } catch {
         // The mutation displays the error in the form.
      }
   }

   return (
      <HuginnDialogPanel className="lg:max-w-sm">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title="Reset Password" />
               {step === "email" && !authenticated ? (
                  <>
                     <div className="text-text/70">Enter the email address on your account. We'll send you a code.</div>
                     <HuginnInput {...register("email", { required: true })}>
                        <HuginnInput.Label>Email</HuginnInput.Label>
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input />
                        </HuginnInput.Wrapper>
                     </HuginnInput>
                  </>
               ) : (
                  <>
                     <div className="text-text/70">
                        {authenticated ? (
                           <>
                              Enter the code sent to <span className="text-text">{getValues("email") || "your account email"}</span>.
                           </>
                        ) : (
                           <>
                              If an account with this email exists, a code was sent to <span className="text-text">{getValues("email")}</span>.
                           </>
                        )}
                     </div>
                     <HuginnInput {...register("code", { required: true })}>
                        <HuginnInput.Label>Reset code</HuginnInput.Label>
                        <OTPInput />
                     </HuginnInput>
                     <PasswordInput {...register("newPassword", { required: true })}>
                        <HuginnInput.Label>New password</HuginnInput.Label>
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input />
                           <PasswordInput.ToggleButton />
                        </HuginnInput.Wrapper>
                     </PasswordInput>
                  </>
               )}
            </DialogBody>
            <DialogActions>
               {step === "code" && (
                  <HuginnButton
                     type="button"
                     color="surface"
                     className="h-10 w-full"
                     onClick={() => requestMutation.mutate(getValues("email"))}
                     disabled={requestMutation.isPending || countdown > 0}
                  >
                     Resend code {countdown > 0 ? `(${countdown}s)` : ""}
                  </HuginnButton>
               )}
               <HuginnLoadingButton
                  isLoading={formState.isSubmitting || requestMutation.isPending || confirmMutation.isPending}
                  color="primary"
                  className="h-10 w-full"
                  type="submit"
               >
                  {step === "email" && !authenticated ? "Send code" : "Reset password"}
               </HuginnLoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
