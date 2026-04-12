import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useOAuth } from "@hooks/useOAuth";
import { JsonCode, type OAuthType, type HuginnErrorData } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";

import HuginnDialogPanel from "../HuginnDialogPanel";

type Inputs = {
   email: string;
   password?: string;
};

export default function ChangeEmailModal() {
   const { tokenPayload } = useThisUser();
   const { register, handleSubmit, formState, handleErrors, getValues } = useHuginnForm<Inputs>();
   const { updateModals } = useModals();
   const startOAuth = useOAuth();
   const isOAuth = useIsOAuth();

   const patchMutation = usePatchUser((result) => {
      updateModals({
         changeEmail: { isOpen: false },
         verifyEmail: {
            isOpen: true,
            pendingEmail: result?.pendingEmail ?? getValues("email"),
            title: "Verify Email",
         },
      });
   }, onError);

   async function onSubmit(data: Inputs) {
      await patchMutation.mutateAsync({
         email: data.email,
         password: data.password,
      });
   }

   async function onError(error: HuginnErrorData) {
      if (error.code === JsonCode.REAUTHENTICATION_REQUIRED) {
         const result = await startOAuth(tokenPayload?.authType as OAuthType);
         if (result) await handleSubmit(onSubmit)();
      } else handleErrors(error);
      return true;
   }

   return (
      <HuginnDialogPanel className="w-full max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title="Change Email" />
               <HuginnInput {...register("email", { required: true })}>
                  <HuginnInput.Label>New Email</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
               {!isOAuth && (
                  <PasswordInput {...register("password", { required: true })}>
                     <HuginnInput.Label>Password</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                        <PasswordInput.ToggleButton />
                     </HuginnInput.Wrapper>
                  </PasswordInput>
               )}
            </DialogBody>
            <DialogActions>
               <LoadingButton isLoading={formState.isSubmitting} color="primary" className="h-10 w-full" type="submit">
                  Save
               </LoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
