import UserProfilePreview from "@components/profile/UserProfilePreview";
import { useChannelRecipients } from "@hooks/api-hooks/channelHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useCreateRelationship } from "@hooks/mutations/useCreateRelationship";
import { usePatchDMChannel } from "@hooks/mutations/usePatchDMChannel";
import { useRemoveChannelRecipient } from "@hooks/mutations/useRemoveChannelRecipient";
import { RelationshipType } from "@huginnjs/shared";
import { useClientStore } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";

import ContextMenu from "./ContextMenu";

export default function ChannelRecipientContextMenu() {
   const { data } = useContextMenu("dm_channel_recipient");
   const { user } = useThisUser();
   const deleteMutation = useRemoveChannelRecipient();
   const createMutation = useCreateDMChannel("create-dm-channel_recipient");
   const createRelationship = useCreateRelationship();
   const editMutation = usePatchDMChannel();
   const { readyData } = useClientStore();
   const { ownerId } = useChannelRecipients(data?.channelId, "@me");
   const { updateModals } = useModals();

   const isFriend = readyData?.relationships.some(
      (relationship) => relationship.user.id === data?.recipient.id && relationship.type === RelationshipType.FRIEND,
   );

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

   function handleAddFriend() {
      if (!data) return;
      createRelationship.mutate({ userId: data.recipient.id });
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
               {!isFriend && <ContextMenu.Item label="Add Friend" onClick={handleAddFriend} disabled={createRelationship.isPending} />}
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
