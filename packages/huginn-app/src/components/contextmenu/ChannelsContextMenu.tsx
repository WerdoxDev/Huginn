import { useSafeDeleteDMChannel } from "@hooks/api-hooks/channelHooks";
import { usePinnedChannels } from "@hooks/usePinnedChannels";
import { ChannelType } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";

import ContextMenu from "./ContextMenu";

export default function ChannelsContextMenu() {
   const { data } = useContextMenu("dm_channel");
   const { updateModals } = useModals();
   const { isPinned, togglePin } = usePinnedChannels();

   const { tryMutate } = useSafeDeleteDMChannel(data?.id, data?.type, data?.name);

   if (!data) return;

   return (
      <>
         {data.type === ChannelType.DM && (
            <ContextMenu.Item
               label="View Profile"
               onClick={() => {
                  updateModals({ userProfile: { isOpen: true, userId: data.recipientIds[0] } });
               }}
            />
         )}
         <ContextMenu.Item label={isPinned(data.id) ? "Unpin" : "Pin"} onClick={() => togglePin(data.id)}>
            <IconMingcutePinFill />
         </ContextMenu.Item>
         <ContextMenu.Divider />
         <ContextMenu.Item label={data.type === ChannelType.DM ? "Close DM" : "Leave Group"} onClick={tryMutate} color="negative" />
         {data.type === ChannelType.GROUP_DM && (
            <ContextMenu.Item label="Edit Channel" onClick={() => updateModals({ editGroup: { isOpen: true, channel: data } })}>
               <IconMingcuteEdit2Fill />
            </ContextMenu.Item>
         )}
         <ContextMenu.Divider />
         {data.type === ChannelType.DM && (
            <ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.recipientIds[0])}>
               <IconMingcuteIdcardFill />
            </ContextMenu.Item>
         )}
         <ContextMenu.Item label="Copy Channel ID" onClick={() => navigator.clipboard.writeText(data.id)}>
            <IconMingcuteIdcardFill />
         </ContextMenu.Item>
      </>
   );
}
