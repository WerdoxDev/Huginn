import ResetPasswordButton from "@components/button/ResetPasswordButton";
import PasswordInput from "@components/input/PasswordInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useRecentAuthentication } from "@hooks/useRecentAuthentication";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import { DialogActions, DialogBody, HuginnDialogPanel, HuginnDialogTitle, HuginnInput, HuginnLoadingButton } from "@huginn/frontend-shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

type Inputs = {
   username: string;
   password?: string;
};

export default function ChangeUsernameModal() {
   const { user } = useThisUser();
   const { register, handleSubmit, formState, handleErrors, control, setFocus } = useHuginnForm<Inputs>({
      defaultValues: { username: user?.username },
   });
   const { validate } = useUniqueUsernameMessage(control, user?.username);
   const { updateModals, changeUsername: modal } = useModals();
   const posthog = usePostHog();
   const recentAuthentication = useRecentAuthentication();
   const mutation = usePatchUser(
      () => {
         posthog.capture("profile:username_changed");
         updateModals({ changeUsername: { isOpen: false } });
      },
      (error) => recentAuthentication.handleMutationError(error, handleErrors),
   );
   const isOAuth = useIsOAuth();

   useEffect(() => {
      if (modal.isOpen) {
         setFocus("username");
      }
   }, [modal]);

   async function onSubmit(data: Inputs) {
      const body = { username: data.username, password: data.password };
      try {
         await recentAuthentication.run(() => mutation.mutateAsync(body), { reason: "change your username" });
      } catch {
         // The mutation displays server errors in the form.
      }
   }

   return (
      <HuginnDialogPanel className="lg:max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title="Change Username" />
               <HuginnInput {...register("username", { validate, required: true })}>
                  <HuginnInput.Label>Username</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
               {!isOAuth && (
                  <>
                     <PasswordInput {...register("password", { required: true })}>
                        <HuginnInput.Label>Password</HuginnInput.Label>
                        <HuginnInput.Wrapper>
                           <HuginnInput.Input />
                           <PasswordInput.ToggleButton />
                        </HuginnInput.Wrapper>
                        <ResetPasswordButton from="changeUsername" />
                     </PasswordInput>
                  </>
               )}
            </DialogBody>
            <DialogActions>
               <HuginnLoadingButton isLoading={formState.isSubmitting} color="primary" className="h-10 w-full" type="submit">
                  Save
               </HuginnLoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
