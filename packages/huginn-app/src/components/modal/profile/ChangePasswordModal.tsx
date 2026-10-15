import CautionInfo from "@components/CautionInfo";
import ResetPasswordButton from "@components/button/ResetPasswordButton";
import PasswordInput from "@components/input/PasswordInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useLogout } from "@hooks/useLogout";
import { useRecentAuthentication } from "@hooks/useRecentAuthentication";
import { DialogActions, DialogBody, HuginnDialogPanel, HuginnDialogTitle, HuginnInput, HuginnLoadingButton } from "@huginn/frontend-shared";
import { type APIGetAuthMethodsResult } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type Inputs = {
   newPassword?: string;
   password?: string;
};

export default function ChangePasswordModal() {
   const { register, handleSubmit, formState, handleErrors, setFocus } = useHuginnForm<Inputs>();
   const { updateModals, changePassword: modal } = useModals();
   const isOAuth = useIsOAuth();
   const logout = useLogout();
   const recentAuthentication = useRecentAuthentication();
   const queryClient = useQueryClient();
   const passwordConfigured = queryClient.getQueryData<APIGetAuthMethodsResult>(["auth-methods"])?.password.configured;
   const mutation = usePatchUser(
      () => {
         if (!modal.removePassword) {
            void queryClient.invalidateQueries({ queryKey: ["auth-methods"] });
            void queryClient.invalidateQueries({ queryKey: ["devices"] });
         }
         updateModals({ changePassword: { isOpen: false } });
      },
      (error) => recentAuthentication.handleMutationError(error, handleErrors),
   );

   useEffect(() => {
      if (modal.isOpen) {
         setFocus(modal.removePassword ? "password" : "newPassword");
      }
   }, [modal]);

   async function onSubmit(data: Inputs) {
      const body = { newPassword: modal.removePassword ? null : data.newPassword, password: data.password };
      let result;
      try {
         result = await recentAuthentication.run(() => mutation.mutateAsync(body), {
            reason: modal.removePassword ? "remove your password" : "set or change your password",
         });
      } catch {
         // The mutation displays server errors in the form.
         return;
      }
      if (result && modal.removePassword) await logout();
   }

   return (
      <HuginnDialogPanel className="lg:max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle
                  title={modal.removePassword ? "Remove Password" : isOAuth && !passwordConfigured ? "Set Password" : "Change Password"}
               />
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
                  <>
                     <PasswordInput {...register("password", { required: true })}>
                        <HuginnInput.Label>Current Password</HuginnInput.Label>
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input />
                           <PasswordInput.ToggleButton />
                        </HuginnInput.Wrapper>
                     </PasswordInput>
                     <ResetPasswordButton from="changePassword" />
                  </>
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
