import CautionInfo from "@components/CautionInfo";
import PasswordInput from "@components/input/PasswordInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useLogout } from "@hooks/useLogout";
import { useOAuth } from "@hooks/useOAuth";
import { DialogActions, DialogBody, HuginnDialogPanel, HuginnDialogTitle, HuginnInput, HuginnLoadingButton } from "@huginn/frontend-shared";
import { JsonCode, type APIGetAuthMethodsResult, type HuginnErrorData, type OAuthProvider } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type Inputs = {
   newPassword?: string;
   password?: string;
};

export default function ChangePasswordModal() {
   const { register, handleSubmit, formState, handleErrors, setFocus } = useHuginnForm<Inputs>();
   const { updateModals, changePassword: modal } = useModals();
   const { tokenPayload } = useThisUser();
   const isOAuth = useIsOAuth();
   const logout = useLogout();
   const startOAuth = useOAuth();
   const queryClient = useQueryClient();
   const passwordConfigured = queryClient.getQueryData<APIGetAuthMethodsResult>(["auth-methods"])?.password.configured;
   const mutation = usePatchUser(() => {
      if (!modal.removePassword) void queryClient.invalidateQueries({ queryKey: ["auth-methods"] });
      updateModals({ changePassword: { isOpen: false } });
   }, onError);

   useEffect(() => {
      if (modal.isOpen) {
         setFocus(modal.removePassword ? "password" : "newPassword");
      }
   }, [modal]);

   async function onSubmit(data: Inputs) {
      await mutation.mutateAsync({ newPassword: modal.removePassword ? null : data.newPassword, password: data.password });
      if (modal.removePassword) await logout();
   }

   async function onError(error: HuginnErrorData) {
      if (error.code === JsonCode.REAUTHENTICATION_REQUIRED) {
         const result = await startOAuth(tokenPayload?.authType as OAuthProvider);
         if (result) await handleSubmit(onSubmit)();
      } else handleErrors(error);
      return true;
   }

   return (
      <HuginnDialogPanel className="lg:max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title={modal.removePassword ? "Remove Password" : isOAuth && !passwordConfigured ? "Set Password" : "Change Password"} />
               {isOAuth && !modal.removePassword && <CautionInfo>Password sign-in for an OAuth account isn't recommended.</CautionInfo>}
               {!modal.removePassword && (
                  <PasswordInput {...register("newPassword", { required: true })}>
                     <HuginnInput.Label>New Password</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                        <PasswordInput.ToggleButton />
                     </HuginnInput.Wrapper>
                  </PasswordInput>
               )}
               {!isOAuth && (
                  <PasswordInput {...register("password", { required: true })}>
                     <HuginnInput.Label>Current Password</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                        <PasswordInput.ToggleButton />
                     </HuginnInput.Wrapper>
                  </PasswordInput>
               )}
            </DialogBody>
            <DialogActions>
               <HuginnLoadingButton isLoading={formState.isSubmitting} color="primary" className="h-10 w-full" type="submit">
                  {modal.removePassword ? "Remove Password" : "Save"}
               </HuginnLoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
