import { ContextMenuDMChannel, ContextMenuType } from "@/types";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { ChannelType } from "@shared/api-types";
import { useMemo } from "react";
import { ContextMenu } from "./ContextMenu";

export function ChannelsContextMenu() {
   const { context, close } = useContextMenu<ContextMenuDMChannel>(ContextMenuType.DM_CHANNEL);
   const deleteChannelMutation = useDeleteDMChannel();

   const data = useMemo(() => context?.data!, [context]);
   if (!context || !context.data) return;

   return (
      <ContextMenu close={close} isOpen={context.isOpen} position={context.position}>
         <ContextMenu.Item
            label={data.type === ChannelType.DM ? "Close DM" : "Leave Group"}
            onClick={() => deleteChannelMutation.mutate(data.id)}
            className="!text-error focus:!bg-error/80 focus:!text-white"
         />
         <ContextMenu.Divider />
         <ContextMenu.Item label="Copy User ID">
            <IconMdiIdentificationCard />
         </ContextMenu.Item>
      </ContextMenu>
   );
}
