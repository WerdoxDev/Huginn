import { useContextMenu, useContextMenuDispatch } from "@contexts/contextMenuContext";
import { useRemoveChannel } from "@hooks/useDeleteChannel";
import { ChannelType } from "@shared/api-types";
import { useMemo } from "react";
import { ContextMenu } from "./ContextMenu";

export function ChannelsContextMenu() {
   const contextMenu = useContextMenu();
   const dispatch = useContextMenuDispatch();

   const removeChannelMutation = useRemoveChannel();

   const data = useMemo(() => contextMenu.dmChannel!.data!, [contextMenu.dmChannel]);

   if (!contextMenu.dmChannel || !contextMenu.dmChannel.data) return;

   return (
      <ContextMenu
         close={() => dispatch({ dmChannel: { isOpen: false } })}
         isOpen={contextMenu.dmChannel.isOpen}
         position={contextMenu.dmChannel.position}
      >
         <ContextMenu.Item
            label={data.type === ChannelType.DM ? "Close DM" : "Leave Group"}
            onClick={() => removeChannelMutation(data.id)}
            className="!text-error focus:!bg-error/80 focus:!text-white"
         />
         <ContextMenu.Divider />
         <ContextMenu.Item label="Copy User ID">
            <IconMdiIdentificationCard />
         </ContextMenu.Item>
      </ContextMenu>
   );
}
