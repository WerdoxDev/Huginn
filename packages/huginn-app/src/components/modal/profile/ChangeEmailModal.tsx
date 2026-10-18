import ResetPasswordButton from "@components/button/ResetPasswordButton";
import PasswordInput from "@components/input/PasswordInput";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useRecentAuthentication } from "@hooks/useRecentAuthentication";
import { DialogActions, DialogBody, HuginnDialogPanel, HuginnDialogTitle, HuginnInput, HuginnLoadingButton } from "@huginn/frontend-shared";
import { useModals } from "@stores/modalsStore";

type Inputs = {
   email: string;
   password?: string;
};

export default function ChangeEmailModal() {
   const { register, handleSubmit, formState, handleErrors, getValues } = useHuginnForm<Inputs>();
   const { updateModals } = useModals();
   const recentAuthentication = useRecentAuthentication();
   const isOAuth = useIsOAuth();

   const patchMutation = usePatchUser(
      (result) => {
         updateModals({
            changeEmail: { isOpen: false },
            verifyEmail: {
               isOpen: true,
               pendingEmail: result?.pendingEmail ?? getValues("email"),
            },
         });
      },
      (error) => recentAuthentication.handleMutationError(error, handleErrors),
   );

   async function onSubmit(data: Inputs) {
      const body = { email: data.email, password: data.password };
      try {
         await recentAuthentication.run(() => patchMutation.mutateAsync(body), { reason: "change your email" });
      } catch {
         // The mutation displays server errors in the form.
      }
   }

   return (
      <HuginnDialogPanel className="lg:max-w-sm">
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
                  <>
                     <div>
                        <PasswordInput {...register("password", { required: true })}>
                           <HuginnInput.Label>Password</HuginnInput.Label>
                           <HuginnInput.Wrapper>
                              <HuginnInput.Input />
                              <PasswordInput.ToggleButton />
                           </HuginnInput.Wrapper>
                        </PasswordInput>
                        <ResetPasswordButton from="changeEmail" />
                     </div>
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
