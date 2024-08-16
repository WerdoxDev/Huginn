import { SettingsTabProps } from "@/types";
import AnimatedMessage from "@components/AnimatedMessage";
import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import { useClient } from "@contexts/apiContext";
import { Transition } from "@headlessui/react";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useInputs } from "@hooks/useInputs";
import useUniqueUsernameMessage from "@hooks/useUniqueUsernameMessage";
import { useMemo, useRef, useState } from "react";

export default function SettingsProfileTab(props: SettingsTabProps) {
   const client = useClient();
   const user = useRef(client.user);

   const { inputsProps, values, handleErrors } = useInputs([
      { name: "username", required: true, default: user.current?.username },
      { name: "displayName", required: true, default: user.current?.displayName },
      { name: "password", required: false },
   ]);

   const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, "username");

   const mutation = usePatchUser(result => {
      client.user = result;
   }, handleErrors);

   const [modified, setModified] = useState(false);

   useMemo(() => {
      setModified(values.username.value !== client.user?.username || values.displayName.value !== client.user.displayName);
   }, [values, client.user]);

   async function edit() {
      await mutation.mutateAsync({
         displayName: values.displayName.value,
         username: values.username.value === user.current?.username ? undefined : values.username.value,
         password: values.password.value,
      });
   }

   return (
      <div className="">
         <div className="flex h-full flex-col items-start gap-5">
            <div className="bg-secondary flex-shrink-0 rounded-lg p-4">
               <div className="bg-primary h-24 w-24 rounded-full"></div>
            </div>
            <div className="bg-secondary mb-20 flex w-full flex-col gap-y-5 rounded-lg p-4">
               <HuginnInput
                  {...inputsProps.username}
                  className="[&_input]:lowercase"
                  onFocus={focused => {
                     onFocusChanged(focused);
                  }}
                  inputProps={{ className: "!bg-background" }}
               >
                  <HuginnInput.Label>Username</HuginnInput.Label>
                  <HuginnInput.After>
                     <AnimatedMessage className="mt-1" {...usernameMessageDetail} />
                  </HuginnInput.After>
               </HuginnInput>
               <HuginnInput {...inputsProps.displayName} inputProps={{ className: "!bg-background" }}>
                  <HuginnInput.Label>Display name</HuginnInput.Label>
               </HuginnInput>
               <PasswordInput {...inputsProps.password} inputProps={{ className: "!bg-background" }}>
                  <HuginnInput.Label>Password</HuginnInput.Label>
               </PasswordInput>
            </div>
         </div>
         <Transition show={modified}>
            <div className="border-primary/50 bg-secondary absolute bottom-5 left-[13.25rem] right-9 flex transform justify-end gap-x-2 rounded-xl border-2 p-2 shadow-sm transition data-[closed]:translate-y-10 data-[closed]:opacity-0">
               <div className="text-text ml-2 w-full self-center ">You have unsaved changes!</div>
               <HuginnButton className="w-20 shrink-0 py-2 decoration-white hover:underline">Revert</HuginnButton>
               <LoadingButton
                  loading={mutation.isPending}
                  disabled={!modified}
                  onClick={edit}
                  className="bg-primary disabled:bg-primary/50 w-36 shrink-0 !rounded-lg py-2"
               >
                  Save changes
               </LoadingButton>
            </div>
         </Transition>
      </div>
   );
}
