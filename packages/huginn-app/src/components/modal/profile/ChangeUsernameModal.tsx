import DialogBody from "@components/DialogBody";
import HuginnDialogPanel from "../HuginnDialogPanel";
import HuginnInput from "@components/input/HuginnInput";
import { useHuginnForm } from "@hooks/useHuginnForm";
import DialogActions from "@components/DialogActions";
import HuginnButton from "@components/button/HuginnButton";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import { useThisUser } from "@stores/userStore";
import { useUniqueUsernameMessage } from "@hooks/useUniqueUsernameMessage";
import { useOAuth } from "@hooks/useOAuth";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import LoadingButton from "@components/button/LoadingButton";
import { useEffect } from "react";
import { JsonCode, type OAuthType, type HuginnErrorData } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";

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
   const mutation = usePatchUser(() => {
      updateModals({ changeUsername: { isOpen: false } });
   }, onError);
   const startOAuth = useOAuth();

   const isOAuth = tokenPayload?.authType === "github" || tokenPayload?.authType === "google";

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
      <HuginnDialogPanel className="w-full max-w-xs">
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
                  <HuginnInput {...register("password", { required: true })} type="password">
                     <HuginnInput.Label>Password</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                     </HuginnInput.Wrapper>
                  </HuginnInput>
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
