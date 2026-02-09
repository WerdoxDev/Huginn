import DialogBody from "@components/DialogBody";
import HuginnDialogPanel from "../HuginnDialogPanel";
import HuginnInput from "@components/input/HuginnInput";
import { useHuginnForm } from "@hooks/useHuginnForm";
import DialogActions from "@components/DialogActions";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import { useThisUser } from "@stores/userStore";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import LoadingButton from "@components/button/LoadingButton";
import { useModals } from "@stores/modalsStore";
import { useEffect } from "react";

type Inputs = {
   displayName?: string;
};

export default function ChangeUsernameModal() {
   const { user } = useThisUser();
   const { register, handleSubmit, formState, handleErrors, setFocus } = useHuginnForm<Inputs>({
      defaultValues: { displayName: user?.displayName === user?.username ? undefined : (user?.displayName ?? undefined) },
   });
   const { updateModals, changeDisplayName: modal } = useModals();
   const mutation = usePatchUser(() => {
      updateModals({ changeDisplayName: { isOpen: false } });
   }, handleErrors);

   useEffect(() => {
      if (modal.isOpen) {
         setFocus("displayName");
      }
   }, [modal]);

   async function onSubmit(data: Inputs) {
      await mutation.mutateAsync({ displayName: data.displayName });
   }

   return (
      <HuginnDialogPanel className="w-full max-w-xs">
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody>
               <HuginnDialogTitle title="Change Username" />
               <HuginnInput {...register("displayName")} placeholder={user?.username}>
                  <HuginnInput.Label>Display Name</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
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
