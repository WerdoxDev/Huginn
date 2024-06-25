import { useContextMenu, useContextMenuDispatch } from "@contexts/contextMenuContext";
import { useRemoveFriend } from "@hooks/mutations/useRemoveFriend";
import { useMemo } from "react";
import { ContextMenu } from "./ContextMenu";

export default function RelationshipMoreContextMenu() {
   const contextMenu = useContextMenu();
   const dispatch = useContextMenuDispatch();

   const removeFriendMutation = useRemoveFriend();

   const data = useMemo(() => contextMenu.relationshipMore?.data!, [contextMenu.relationshipMore]);

   if (!contextMenu.relationshipMore || !contextMenu.relationshipMore.data) return;

   return (
      <ContextMenu
         close={() => dispatch({ relationshipMore: { isOpen: false } })}
         isOpen={contextMenu.relationshipMore.isOpen}
         position={contextMenu.relationshipMore.position}
      >
         <ContextMenu.Item
            label="Remove friend"
            onClick={() => removeFriendMutation.mutate(data.user.id)}
            className="!text-error focus:!bg-error/80 focus:!text-white"
         />
         <ContextMenu.Divider />
         <ContextMenu.Item label="Copy User ID">
            <IconMdiIdentificationCard />
         </ContextMenu.Item>
      </ContextMenu>
   );
}
