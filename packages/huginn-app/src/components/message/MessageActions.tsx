import EmojiPickerPanel from "@components/channels/EmojiPickerPanel";
import EmojiPickerPopoverPanel from "@components/channels/EmojiPickerPopoverPanel";
import HuginnPopover from "@components/popover/HuginnPopover";
import Tooltip from "@components/tooltip/Tooltip";
import { useAddReaction } from "@hooks/mutations/useAddReaction";
import { useChannelStore } from "@stores/channelStore";
import { clsx } from "clsx";

import type { ProcessedAppMessage } from "@/types";

const iconClassName = "text-text/80 group-hover/button:text-text size-5 ";

export function MessageActions(props: { message: ProcessedAppMessage; isEmojiOpen: boolean; onEmojiOpenChange?: (open: boolean) => void }) {
   const { setReplyingMessageId, setEditingMessageId } = useChannelStore();
   // const [isPopoverOpen, setIsPopoverOpen] = useState(false);
   const addMutation = useAddReaction();

   function handleReplyClick() {
      setReplyingMessageId(props.message.id);
   }

   function handleEditClick() {
      setEditingMessageId(props.message.id);
   }

   async function handleEmojiSelect(slug: string, unicode?: string) {
      if (!unicode) return;

      await addMutation.mutateAsync({
         channelId: props.message.channelId,
         messageId: props.message.id,
         emojiId: null,
         emojiName: unicode,
      });
   }

   return (
      <div
         className={clsx(
            "bg-surface pointer-events-none absolute -top-8 right-5 z-20 flex h-10 items-center justify-center rounded-lg p-1 opacity-0 shadow-md transition-[opacity,box-shadow] duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-data-context:opacity-100 hover:shadow-xl",
         )}
      >
         <HuginnPopover open={props.isEmojiOpen} onOpenChange={props.onEmojiOpenChange}>
            <HuginnPopover.Trigger asChild>
               <ActionButton tooltip="Add Reaction">
                  <IconMingcuteEmoji2Fill className={iconClassName} />
               </ActionButton>
            </HuginnPopover.Trigger>
            <EmojiPickerPopoverPanel>
               <EmojiPickerPanel onEmojiSelect={handleEmojiSelect} maxWidth={340} maxHeight={480} />
            </EmojiPickerPopoverPanel>
         </HuginnPopover>
         <ActionButton onClick={handleEditClick} tooltip="Edit">
            <IconMingcuteEdit2Fill className={iconClassName} />
         </ActionButton>
         <ActionButton onClick={handleReplyClick} tooltip="Reply">
            <IconMingcuteCornerUpLeftFill className={iconClassName} />
         </ActionButton>
      </div>
   );
}

function ActionButton(props: { onClick?: () => void; children?: React.ReactNode; tooltip: string }) {
   return (
      <Tooltip>
         <Tooltip.Trigger asChild>
            <button className="hover:bg-surface-alt group/button rounded-md p-1.5" onClick={props.onClick}>
               {props.children}
            </button>
         </Tooltip.Trigger>
         <Tooltip.Content>{props.tooltip}</Tooltip.Content>
      </Tooltip>
   );
}
