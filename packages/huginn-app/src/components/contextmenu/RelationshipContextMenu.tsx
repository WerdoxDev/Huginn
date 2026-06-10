import UserProfilePreview from "@components/profile/UserProfilePreview";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useRemoveRelationship } from "@hooks/mutations/useRemoveRelationship";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { usePostHog } from "posthog-js/react";

import ContextMenu from "./ContextMenu";

export default function RelationshipContextMenu() {
   const { data } = useContextMenu("relationship");
   const removeMutation = useRemoveRelationship();
   const createMutation = useCreateDMChannel("create-dm-channel_other");
   const { updateModals } = useModals();
   const posthog = usePostHog();

   if (!data) return;

   return (
      <>
         <UserProfilePreview userId={data.user.id} />
         <ContextMenu.Divider />
         <ContextMenu.Item
            label="View Profile"
            onClick={() => {
               updateModals({ userProfile: { isOpen: true, userId: data.user.id } });
            }}
         />
         <ContextMenu.Item
            label="Message"
            onClick={() => {
               createMutation.mutate({ recipients: [data.user.id] });
            }}
         />
         <ContextMenu.Item
            label="Remove friend"
            onClick={() => {
               posthog.capture("friend:removed");
               removeMutation.mutate(data.user.id);
            }}
            color="negative"
         />
         <ContextMenu.Divider />
         <ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.user.id)}>
            <IconMingcuteIdcardFill />
         </ContextMenu.Item>
      </>
   );
}
