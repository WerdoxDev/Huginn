import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import AddRecipientInput from "@components/input/AddRecipientInput";
import HuginnInput from "@components/input/HuginnInput";
import { useChannelNamePlaceholder } from "@hooks/api-hooks/channelHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { getRelationshipsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { AppUser } from "@/types";

import HuginnDialogPanel from "./HuginnDialogPanel";
// import { usePostHog } from "posthog-js/react";

type Input = {
   name?: string;
};

export default function CreateDMModal() {
   const { createDM: modal, updateModals } = useModals();

   const client = useClient();
   // const posthog = usePostHog();
   const { data } = useQuery(getRelationshipsOptions(client!));

   const [selectedUsers, setSelectedUsers] = useState<AppUser[]>([]);
   const { handleErrors, setValue, register, values } = useHuginnForm<Input>();

   const mutation = useCreateDMChannel("create-dm-channel_other", handleErrors);

   const placeholderName = useChannelNamePlaceholder(selectedUsers);

   useEffect(() => {
      if (modal.isOpen) {
         // posthog.capture("create_group_modal_opened");
         setSelectedUsers([]);
      } else {
         // posthog.capture("create_group_modal_closed");
      }
   }, [modal.isOpen]);

   useEffect(() => {
      if (selectedUsers.length < 2) {
         setValue("name", "");
      }
   }, [selectedUsers]);

   function onSelectionChanged(values: AppUser[]) {
      setSelectedUsers(values);
   }

   function close() {
      updateModals({ createDM: { isOpen: false } });
   }

   async function findOrCreate() {
      await mutation.mutateAsync({
         recipients: selectedUsers?.map((x) => x.id),
         name: values.name,
      });
      close();
   }
   return (
      <HuginnDialogPanel className="max-w-md">
         <DialogBody>
            <HuginnDialogTitle title="Create Direct Message" description="Select your fellow warrior(s) to share a tale with!" />
            <HuginnInput
               {...register("name")}
               placeholder={selectedUsers.length > 1 ? placeholderName : "Select 2 or more members"}
               disabled={selectedUsers.length < 2}
            >
               <HuginnInput.Label>Group Name</HuginnInput.Label>
               <HuginnInput.Wrapper>
                  <HuginnInput.Input />
               </HuginnInput.Wrapper>
            </HuginnInput>

            <AddRecipientInput relationships={data} onSelectionChanged={onSelectionChanged} />
         </DialogBody>
         <DialogActions>
            <HuginnButton color="surface" className="w-full" onClick={close}>
               Cancel
            </HuginnButton>
            <LoadingButton
               isLoading={mutation.isPending}
               className="h-10 w-full"
               color="primary"
               onClick={findOrCreate}
               disabled={selectedUsers.length === 0}
            >
               Find or Create
            </LoadingButton>
         </DialogActions>
      </HuginnDialogPanel>
   );
}
