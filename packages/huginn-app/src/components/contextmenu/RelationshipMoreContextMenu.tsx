import { useRemoveRelationship } from "@hooks/mutations/useRemoveRelationship";
import { useContextMenu } from "@stores/contextMenuStore";

import ContextMenu from "./ContextMenu";

export default function RelationshipMoreContextMenu() {
   const { data } = useContextMenu("relationship_more");
   const removeMutation = useRemoveRelationship();

   if (!data) return;

   return (
      <ContextMenu.Item
         label="Remove friend"
         onClick={() => {
            removeMutation.mutate(data.user.id);
         }}
         color="negative"
      />
   );
}
