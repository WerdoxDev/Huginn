import Tooltip from "@components/tooltip/Tooltip";
import { useAddReaction } from "@hooks/mutations/useAddReaction";
import { useChannelStore } from "@stores/channelStore";
import { usePopover } from "@stores/popoverStore";
import { useThisUser } from "@stores/userStore";
import { useMemo, type MouseEvent } from "react";

import type { ProcessedAppMessage } from "@/types";

const iconClassName = "text-white/70 group-hover/button:text-white size-5 ";

export function MessageActions(props: { message: ProcessedAppMessage }) {
   const { setReplyingMessageId, setEditingMessageId } = useChannelStore();
   const { toggle } = usePopover("expression");
   const addMutation = useAddReaction();
   const { user } = useThisUser();

   const isAuthor = useMemo(() => props.message?.authorId === user?.id, [user, props.message]);

   function handleReplyClick() {
      setReplyingMessageId(props.message.id);
   }

   function handleEditClick() {
      setEditingMessageId(props.message.id);
   }

   function handleEmojiSelect(slug: string, unicode?: string) {
      if (!unicode) return;

      addMutation.mutate({
         channelId: props.message.channelId,
         messageId: props.message.id,
         emojiId: null,
         emojiName: unicode,
      });
   }

   return (
      <div className="pointer-events-none flex shrink-0 items-center opacity-0 transition-opacity duration-150 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 group-data-context:pointer-events-auto group-data-context:opacity-100">
         <ActionButton
            tooltip="Add Reaction"
            onClick={(e) => toggle(e, { type: "emoji", onEmojiSelect: handleEmojiSelect, messageId: props.message.id })}
         >
            <IconMingcuteEmoji2Fill className={iconClassName} />
         </ActionButton>
         {isAuthor && (
            <ActionButton onClick={handleEditClick} tooltip="Edit">
               <IconMingcuteEdit2Fill className={iconClassName} />
            </ActionButton>
         )}
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
            <button className="hover:bg-surface-alt group/button rounded-md p-1.75" onClick={props.onClick}>
               {props.children}
            </button>
         </Tooltip.Trigger>
         <Tooltip.Content>{props.tooltip}</Tooltip.Content>
      </Tooltip>
   );
}
