import type { MouseEvent } from "react";

import Tooltip from "@components/tooltip/Tooltip";
import { useAddReaction } from "@hooks/mutations/useAddReaction";
import { useChannelStore } from "@stores/channelStore";
import { usePopover } from "@stores/popoverStore";
import { clsx } from "clsx";

import type { ProcessedAppMessage } from "@/types";

const iconClassName = "text-text/80 group-hover/button:text-text size-5 ";

export function MessageActions(props: { message: ProcessedAppMessage; isEmojiOpen: boolean; onEmojiOpenChange?: (open: boolean) => void }) {
   const { setReplyingMessageId, setEditingMessageId } = useChannelStore();
   const { toggle } = usePopover("emoji_picker", { onEmojiSelect: handleEmojiSelect });
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
            "pointer-events-none absolute -top-8 right-5 z-20 flex h-10 items-center justify-center rounded-lg bg-zinc-900 p-1 opacity-0 shadow-md transition-[opacity,box-shadow] duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-data-context:opacity-100 hover:shadow-xl",
         )}
      >
         <ActionButton tooltip="Add Reaction" onClick={toggle}>
            <IconMingcuteEmoji2Fill className={iconClassName} />
         </ActionButton>
         <ActionButton onClick={handleEditClick} tooltip="Edit">
            <IconMingcuteEdit2Fill className={iconClassName} />
         </ActionButton>
         <ActionButton onClick={handleReplyClick} tooltip="Reply">
            <IconMingcuteCornerUpLeftFill className={iconClassName} />
         </ActionButton>
      </div>
   );
}

function ActionButton(props: { onClick?: (e: MouseEvent<HTMLButtonElement>) => void; children?: React.ReactNode; tooltip: string }) {
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
