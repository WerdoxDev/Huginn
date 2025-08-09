import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import AddRecipientInput from "@components/input/AddRecipientInput";
import { Description, DialogPanel, DialogTitle } from "@headlessui/react";
import { useChannelRecipients } from "@hooks/api-hooks/channelHooks";
import { useAddChannelRecipient } from "@hooks/mutations/useAddChannelRecipient";
import type { APIRelationUser } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
// import { usePostHog } from "posthog-js/react";

export default function AddRecipientModal() {
   const { addRecipient: modal, updateModals } = useModals();
   const client = useClient();

   // const posthog = usePostHog();
   const { data } = useQuery(getRelationshipsOptions(client!));

   const { recipients } = useChannelRecipients(modal.channelId, "@me");
   const relationships = useMemo(() => data?.filter((x) => !recipients?.map((y) => y?.id).includes(x.userId)), [recipients, data]);

   const [selectedUsers, setSelectedUsers] = useState<APIRelationUser[]>([]);

   const mutation = useAddChannelRecipient();

   useEffect(() => {
      if (modal.isOpen) {
         // posthog.capture("add_recipient_modal_opened");
         setSelectedUsers([]);
      } else {
         // posthog.capture("add_recipient_modal_closed");
      }
   }, [modal.isOpen]);

   function close() {
      updateModals({ addRecipient: { isOpen: false } });
   }

   function onSelectionChanged(values: APIRelationUser[]) {
      setSelectedUsers(values);
   }

   async function add() {
      for (const user of selectedUsers) {
         mutation.mutate({
            channelId: modal.channelId,
            recipientId: user.id,
         });
      }
      close();
   }

   return (
      <DialogPanel
         transition
         className="border-primary-700 bg-surface data-closed:scale-90 relative w-full max-w-md transform overflow-hidden rounded-xl border-2 transition-[opacity_transform] duration-200"
      >
         <DialogTitle className="flex items-center justify-center gap-x-1.5">
            <div className="text-text mt-5 text-2xl font-medium">Add Member</div>
         </DialogTitle>
         <Description className="text-text/70 mx-5 mt-1 text-center">Add your fellow warrior(s) to also share a tale with!</Description>
         <div className="flex flex-col gap-y-5 p-6">
            <AddRecipientInput label="New Members" relationships={relationships} onSelectionChanged={onSelectionChanged} />
         </div>
         <div className="bg-surface-alt p-5">
            <LoadingButton loading={mutation.isPending} className="h-10 w-full" color="primary" onClick={add} disabled={selectedUsers.length === 0}>
               Add
            </LoadingButton>
         </div>
         <ModalCloseButton onClick={close} />
      </DialogPanel>
   );
}
