import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import AddRecipientInput from "@components/input/AddRecipientInput";
import { useChannelRecipients } from "@hooks/api-hooks/channelHooks";
import { useAddChannelRecipient } from "@hooks/mutations/useAddChannelRecipient";
import { getRelationshipsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { AppUser } from "@/types";

import { usePostHog } from "posthog-js/react";

import HuginnDialogPanel from "./HuginnDialogPanel";

export default function AddRecipientModal() {
   const { addRecipient: modal, updateModals } = useModals();
   const client = useClient();

   const posthog = usePostHog();
   const { data } = useQuery(getRelationshipsOptions(client!));

   const { recipients } = useChannelRecipients(modal.channelId, "@me");
   const relationships = useMemo(() => data?.filter((x) => !recipients?.map((y) => y?.id).includes(x.userId)), [recipients, data]);

   const [selectedUsers, setSelectedUsers] = useState<AppUser[]>([]);

   const mutation = useAddChannelRecipient();

   useEffect(() => {
      if (modal.isOpen) {
         setSelectedUsers([]);
      }
   }, [modal.isOpen]);

   function close() {
      updateModals({ addRecipient: { isOpen: false } });
   }

   function onSelectionChanged(values: AppUser[]) {
      setSelectedUsers(values);
   }

   async function add() {
      posthog.capture("channel:recipient_added", { recipient_count: selectedUsers.length });
      for (const user of selectedUsers) {
         mutation.mutate({
            channelId: modal.channelId,
            recipientId: user.id,
         });
      }
      close();
   }

   return (
      <HuginnDialogPanel className="lg:max-w-md">
         <DialogBody>
            <HuginnDialogTitle title="Add Member" description="Add your fellow warrior(s) to also share a tale with!" />
            <div className="flex flex-col gap-y-5">
               <AddRecipientInput label="New Members" relationships={relationships} onSelectionChanged={onSelectionChanged} />
            </div>
         </DialogBody>
         <DialogActions>
            <LoadingButton isLoading={mutation.isPending} className="h-10 w-full" color="primary" onClick={add} disabled={selectedUsers.length === 0}>
               Add
            </LoadingButton>
         </DialogActions>
         <ModalCloseButton onClick={close} />
      </HuginnDialogPanel>
   );
}
