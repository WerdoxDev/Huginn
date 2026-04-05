import UserProfilePreview from "@components/profile/UserProfilePreview";
import { useChannelRecipients } from "@hooks/api-hooks/channelHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { usePatchDMChannel } from "@hooks/mutations/usePatchDMChannel";
import { useRemoveChannelRecipient } from "@hooks/mutations/useRemoveChannelRecipient";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";

import ContextMenu from "./ContextMenu";

export default function ChannelRecipientContextMenu() {
   const { data } = useContextMenu("dm_channel_recipient");
   const { user } = useThisUser();
   const deleteMutation = useRemoveChannelRecipient();
   const createMutation = useCreateDMChannel("create-dm-channel_recipient");
   const editMutation = usePatchDMChannel();
   const { ownerId } = useChannelRecipients(data?.channelId, "@me");
   const { updateModals } = useModals();

   function handlePromote() {
      if (!data) return;

      editMutation.mutate({
         channelId: data.channelId,
         owner: data.recipient.id,
      });
   }

   function handleRemove() {
      if (!data) return;
      deleteMutation.mutate({
         channelId: data.channelId,
         recipientId: data.recipient.id,
      });
   }

   function handleMessage() {
      if (!data) return;
      createMutation.mutate({ recipients: [data.recipient.id] });
   }

   function handleViewProfile() {
      if (!data) return;
      updateModals({ userProfile: { isOpen: true, userId: data.recipient.id } });
   }

   if (!data || !user) return;

   return (
      <>
         <UserProfilePreview userId={data.recipient.id} />
         <ContextMenu.Divider />
         <ContextMenu.Item label="View Profile" onClick={handleViewProfile} />
         {data.recipient.id !== user.id && (
            <>
               <ContextMenu.Item label="Message" onClick={handleMessage} />
               {user.id === ownerId && <ContextMenu.Item label="Promote to Owner" onClick={handlePromote} />}
               {user.id === ownerId && <ContextMenu.Item label="Remove Member" onClick={handleRemove} color="negative" />}
               <ContextMenu.Divider />
            </>
         )}
         <ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.recipient.id)}>
            <IconMingcuteIdcardFill />
         </ContextMenu.Item>
      </>
   );
}
