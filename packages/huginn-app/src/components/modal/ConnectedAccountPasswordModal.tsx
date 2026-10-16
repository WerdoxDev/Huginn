import ResetPasswordButton from "@components/button/ResetPasswordButton";
import PasswordInput from "@components/input/PasswordInput";
import { providerNames, useConnectedAccountActions } from "@hooks/useConnectedAccountActions";
import { useHuginnForm } from "@hooks/useHuginnForm";
import {
   DialogActions,
   DialogBody,
   HuginnButton,
   HuginnDialogPanel,
   HuginnDialogTitle,
   HuginnInput,
   HuginnLoadingButton,
} from "@huginn/frontend-shared";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";

export default function ConnectedAccountPasswordModal() {
   const { connectedAccountPassword: modal, updateModals } = useModals();
   const { environment } = useHuginnWindow();
   const { register, handleSubmit, handleErrors, formState } = useHuginnForm<{ password: string }>();
   const { connectMutation, disconnectMutation } = useConnectedAccountActions(handleErrors);

   async function confirmPassword({ password }: { password: string }, openedWindow?: Window | null) {
      if (!modal.action || !modal.provider) {
         openedWindow?.close();
         return;
      }
      try {
         if (modal.action === "connect") {
            await connectMutation.mutateAsync({
               provider: modal.provider,
               password,
               openedWindow,
            });
         } else {
            await disconnectMutation.mutateAsync({
               provider: modal.provider,
               password,
            });
         }
         updateModals({ connectedAccountPassword: { isOpen: false } });
      } catch {
         // The mutation displays server errors in the password field.
      }
   }

   return (
      <HuginnDialogPanel className="lg:max-w-xs">
         <form
            onSubmit={(event) => {
               const openedWindow = modal.action === "connect" && environment === "browser" ? window.open("about:blank", "_blank") : undefined;
               void handleSubmit(
                  (data) => confirmPassword(data, openedWindow),
                  () => openedWindow?.close(),
               )(event);
            }}
         >
            <DialogBody>
               <HuginnDialogTitle title={`${modal.action === "connect" ? "Connect" : "Disconnect"} ${providerNames[modal.provider ?? "google"]}`} />
               <div>
                  <PasswordInput {...register("password", { required: true })}>
                     <HuginnInput.Label>Current Password</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                        <PasswordInput.ToggleButton />
                     </HuginnInput.Wrapper>
                  </PasswordInput>
                  <ResetPasswordButton from="connectedAccountPassword" />
               </div>
            </DialogBody>
            <DialogActions>
               <HuginnButton
                  type="button"
                  color="surface"
                  className="h-10 w-full"
                  onClick={() => updateModals({ connectedAccountPassword: { isOpen: false } })}
               >
                  Cancel
               </HuginnButton>
               <HuginnLoadingButton color="primary" className="h-10 w-full" isLoading={formState.isSubmitting}>
                  {modal.action === "connect" ? "Connect" : "Disconnect"}
               </HuginnLoadingButton>
            </DialogActions>
         </form>
      </HuginnDialogPanel>
   );
}
