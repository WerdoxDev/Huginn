import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useModals } from "@stores/modalsStore";
import { useEffect } from "react";

import HuginnDialogPanel from "../HuginnDialogPanel";

type Inputs = {
   newPassword: string;
   password: string;
};

export default function ChangePasswordModal() {
   const { register, handleSubmit, formState, handleErrors, control, setFocus } = useHuginnForm<Inputs>();
   const { updateModals, changePassword: modal } = useModals();
   const mutation = usePatchUser(() => {
      updateModals({ changePassword: { isOpen: false } });
   }, handleErrors);

   useEffect(() => {
      if (modal.isOpen) {
         setFocus("newPassword");
      }
   }, [modal]);

   async function onSubmit(data: Inputs) {
      await mutation.mutateAsync({ newPassword: data.newPassword, password: data.password });
   }

   // async function onError(error: HuginnErrorData) {
   //    if (error.code === JsonCode.REAUTHENTICATION_REQUIRED) {
   //       const result = await startOAuth(tokenPayload?.authType as OAuthType);
   //       if (result) await handleSubmit(onSubmit)();
   //    } else handleErrors(error);
   // }

   return (
      <HuginnDialogPanel className="lg:max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title="Change Password" />
               <PasswordInput {...register("newPassword", { required: true })}>
                  <HuginnInput.Label>New Password</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                     <PasswordInput.ToggleButton />
                  </HuginnInput.Wrapper>
               </PasswordInput>
               <PasswordInput {...register("password", { required: true })}>
                  <HuginnInput.Label>Current Password</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                     <PasswordInput.ToggleButton />
                  </HuginnInput.Wrapper>
               </PasswordInput>
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
