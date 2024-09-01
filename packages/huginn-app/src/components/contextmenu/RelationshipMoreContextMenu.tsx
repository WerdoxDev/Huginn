import { ContextMenuRelationship, ContextMenuType } from "@/types";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useRemoveFriend } from "@hooks/mutations/useRemoveFriend";
import { useMemo } from "react";
import { ContextMenu } from "./ContextMenu";

export default function RelationshipMoreContextMenu() {
   const { context, close } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP_MORE);
   const removeFriendMutation = useRemoveFriend();

   const data = useMemo(() => context?.contextData, [context]);
   if (!data) return;

   return (
      <ContextMenu close={close} isOpen={context.isOpen} position={context.position}>
         <ContextMenu.Item
            label="Remove friend"
            onClick={() => {
               removeFriendMutation.mutate(data.user.id);
            }}
            className="!text-error focus:!bg-error/80 focus:!text-white"
         />
      </ContextMenu>
   );
}
