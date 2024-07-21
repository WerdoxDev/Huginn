import AddFriendInput from "@components/input/AddFriendInput";
import { TabPanel } from "@headlessui/react";
import { useAddFriend } from "@hooks/mutations/useAddFriend";
import { useInputs } from "@hooks/useInputs";
import { useEffect, useState } from "react";

export default function AddFriendTab() {
   const { inputsProps, values, handleErrors, setInputStatus } = useInputs([{ name: "username", required: false }]);

   const [disabled, setDisabled] = useState(false);

   const mutation = useAddFriend((username) => {
      setInputStatus("username", { code: "success", text: `Friend request sent to ${username}!` });
   }, handleErrors);

   useEffect(() => {
      setDisabled(!values.username.value);
   }, [values]);

   return (
      <TabPanel>
         <div className="text-lg font-medium uppercase text-text">Add Friend</div>
         <div className="mt-1 text-sm text-text/70">You can add your friends using their Huginn username</div>
         <form onSubmit={(e) => { e.preventDefault(); }}>
            <AddFriendInput
               className="mt-5"
               {...inputsProps.username}
               buttonProps={{ type: "submit" }}
               onClick={() => { mutation.mutate(values.username.value); }}
               disabled={disabled}
            />
         </form>
      </TabPanel>
   );
}
