import PasswordInput from "@components/input/PasswordInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useOAuth } from "@hooks/useOAuth";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import { DialogActions, DialogBody, HuginnDialogPanel, HuginnDialogTitle, HuginnInput, HuginnLoadingButton } from "@huginn/frontend-shared";
import { JsonCode, type OAuthType, type HuginnErrorData } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

type Inputs = {
   username: string;
   password?: string;
};

export default function ChangeUsernameModal() {
   const { tokenPayload, user } = useThisUser();
   const { register, handleSubmit, formState, handleErrors, control, setFocus } = useHuginnForm<Inputs>({
      defaultValues: { username: user?.username },
   });
   const { validate } = useUniqueUsernameMessage(control, user?.username);
   const { updateModals, changeUsername: modal } = useModals();
   const posthog = usePostHog();
   const mutation = usePatchUser(() => {
      posthog.capture("profile:username_changed");
      updateModals({ changeUsername: { isOpen: false } });
   }, onError);
   const startOAuth = useOAuth();
   const isOAuth = useIsOAuth();

   useEffect(() => {
      if (modal.isOpen) {
         setFocus("username");
      }
   }, [modal]);

   async function onSubmit(data: Inputs) {
      await mutation.mutateAsync({ username: data.username, password: data.password });
   }

   async function onError(error: HuginnErrorData) {
      if (error.code === JsonCode.REAUTHENTICATION_REQUIRED) {
         const result = await startOAuth(tokenPayload?.authType as OAuthType);
         if (result) await handleSubmit(onSubmit)();
      } else handleErrors(error);
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
               <HuginnLoadingButton isLoading={formState.isSubmitting} color="primary" className="h-10 w-full" type="submit">
                  Save
               </HuginnLoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
