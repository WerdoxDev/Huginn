import { useRemoveRelationship } from "@hooks/mutations/useRemoveRelationship";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";

import ContextMenu from "./ContextMenu";

export default function RelationshipMoreContextMenu() {
   const { data } = useContextMenu("relationship_more");
   const removeMutation = useRemoveRelationship();
   const { updateModals } = useModals();

   if (!data) return;

   return (
      <>
         <ContextMenu.Item
            label="View Profile"
            onClick={() => {
               updateModals({ userProfile: { isOpen: true, userId: data.user.id } });
            }}
         />
         <ContextMenu.Item
            label="Remove friend"
            onClick={() => {
               removeMutation.mutate(data.user.id);
            }}
            color="negative"
         />
      </>
   );
}
