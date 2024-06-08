import { TabPanel } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useHuginnMutation } from "../../hooks/useHuginnMutation";
import { useInputs } from "../../hooks/useInputs";
import { client } from "../../lib/api";
import AddFriendInput from "../input/AddFriendInput";

export default function AddFriendTab() {
   const { inputsProps, values, handleErrors, setInputStatus } = useInputs([{ name: "username", required: false }]);

   const [disabled, setDisabled] = useState(false);

   const mutation = useHuginnMutation(
      {
         async mutationFn(username: string) {
            await client.users.createRelationship({ username: username });
         },
         onSuccess(_, username) {
            setInputStatus("username", { code: "success", text: `Friend request sent to ${username}!` });
         },
      },
      handleErrors,
   );

   useEffect(() => {
      setDisabled(!values.username.value);
   }, [values]);

   async function addFriend() {
      await mutation.mutateAsync(values.username.value);
   }
   return (
      <TabPanel>
         <div className="text-lg font-medium uppercase text-text">Add Friend</div>
         <div className="mt-1 text-sm text-text/70">You can add your friends using their Huginn username</div>
         <AddFriendInput className="mt-5" {...inputsProps.username} onClick={addFriend} disabled={disabled} />
      </TabPanel>
   );
}
