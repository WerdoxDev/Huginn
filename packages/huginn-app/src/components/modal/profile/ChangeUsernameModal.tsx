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
import type { OAuthType } from "@huginn/shared";

type Inputs = {
   username: string;
   password?: string;
};

export default function ChangeUsernameModal() {
   const { register, handleSubmit, values, formState, handleErrors, control } = useHuginnForm<Inputs>();
   const { tokenPayload, user } = useThisUser();
   const { validate } = useUniqueUsernameMessage(control, user?.username);
   const mutation = usePatchUser(undefined, handleErrors);
   const startOAuth = useOAuth();

   const isOAuth = tokenPayload?.authType === "github" || tokenPayload?.authType === "google";

   async function onSubmit() {
      if (isOAuth) {
         await startOAuth(tokenPayload.authType as OAuthType);
      }
      await mutation.mutateAsync({ username: values.username, password: values.password });
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
                  <HuginnInput {...register("password")} type="password">
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
