import DialogBody from "@components/DialogBody";
import HuginnDialogPanel from "../HuginnDialogPanel";
import HuginnInput from "@components/input/HuginnInput";
import { useHuginnForm } from "@hooks/useHuginnForm";
import DialogActions from "@components/DialogActions";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import { useThisUser } from "@stores/userStore";
import { useOAuth } from "@hooks/useOAuth";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useVerifyEmail } from "@hooks/mutations/useVerifyEmail";
import LoadingButton from "@components/button/LoadingButton";
import { useEffect, useState } from "react";
import { JsonCode, type OAuthType, type HuginnErrorData } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useClient } from "@stores/clientStore";

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

   const patchMutation = usePatchUser(() => {
      setIsVerifying(true);
      setFocus("verificationCode");
   }, onError);

   const verificationMutation = useVerifyEmail(() => {
      updateModals({ changeEmail: { isOpen: false } });
   }, handleErrors);

   const startOAuth = useOAuth();

   const isOAuth = tokenPayload?.authType === "github" || tokenPayload?.authType === "google";

   useEffect(() => {
      if (modal.isOpen) {
         setFocus(isVerifying ? "verificationCode" : "email");
      } else {
         setIsVerifying(false);
      }
   }, [modal, isVerifying, setFocus]);

   async function onSubmit(data: Inputs) {
      if (isVerifying) {
         await verificationMutation.mutateAsync({ code: data.verificationCode || "" });
      } else {
         await patchMutation.mutateAsync({ email: data.email, password: data.password });
      }
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
                  <HuginnInput {...register("verificationCode", { required: true })}>
                     <HuginnInput.Label>Verification Code</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                     </HuginnInput.Wrapper>
                  </HuginnInput>
               )}
            </DialogBody>
            <DialogActions>
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
