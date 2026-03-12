import AddFriendInput from "@components/input/AddFriendInput";
import { TabPanel } from "@headlessui/react";
import { useCreateRelationship } from "@hooks/mutations/useCreateRelationship";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useEffect, useState } from "react";

type Input = {
   username?: string;
};

export default function AddFriendTab() {
   const { register, values, handleErrors, setCustomMessage, handleSubmit, formState } = useHuginnForm<Input>();

   const [disabled, setDisabled] = useState(false);

   const mutation = useCreateRelationship(({ username }) => {
      setCustomMessage("username", {
         status: "success",
         text: `Friend request sent to ${username}!`,
      });
   }, handleErrors);

   useEffect(() => {
      setDisabled(!values.username);
   }, [values]);

   async function onSubmit() {
      await mutation.mutateAsync({ username: values.username });
   }

   return (
      <TabPanel>
         <div className="text-text text-lg font-medium uppercase">Add Friend</div>
         <div className="text-text/70 mt-1 text-sm">You can add your friends using their Huginn username</div>
         <form onSubmit={handleSubmit(onSubmit)}>
            <AddFriendInput
               inputProps={{ ...register("username") }}
               loading={formState.isSubmitting}
               className="mt-5"
               buttonProps={{ type: "submit" }}
               disabled={disabled}
            />
         </form>
      </TabPanel>
   );
}
