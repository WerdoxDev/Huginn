import { useAddReaction } from "@hooks/mutations/useAddReaction";
import { useRemoveReaction } from "@hooks/mutations/useRemoveReaction";
import { clamp, getEmojiCodepoint, type APIReaction } from "@huginn/shared";
import { clsx } from "clsx";
import { useMemo, type RefObject } from "react";

import type { ProcessedAppMessage } from "@/types";

export default function MessageReactions(props: { message: ProcessedAppMessage; messageWidth: number; ref: RefObject<HTMLDivElement | null> }) {
   const addMutation = useAddReaction();
   const removeMutation = useRemoveReaction();

   async function handleReactionClick(reaction: APIReaction) {
      if (reaction.me)
         await removeMutation.mutateAsync({
            channelId: props.message.channelId,
            messageId: props.message.id,
            emojiId: reaction.emoji.id,
            emojiName: reaction.emoji.name,
         });
      else
         await addMutation.mutateAsync({
            channelId: props.message.channelId,
            messageId: props.message.id,
            emojiId: reaction.emoji.id,
            emojiName: reaction.emoji.name,
         });
   }

   if (props.message.reactions === undefined || props.message.reactions.length === 0) return null;

   return (
      <div
         className={clsx("mt-0.5 flex items-center justify-center gap-x-0.5 overflow-hidden rounded-lg rounded-tl-none select-none")}
         ref={props.ref}
         style={{
            borderTopRightRadius: `${clamp((props.ref.current?.clientWidth ?? 0) - (props.messageWidth + 20), 0, 8)}px`,
         }}
      >
         {props.message.reactions?.map((x) => (
            <button
               onClick={() => handleReactionClick(x)}
               key={x.emoji.name}
               className={clsx(
                  "flex cursor-pointer items-center gap-x-2 py-1.5 pr-2.5 pl-2",
                  x.me ? "bg-primary-800/50 hover:bg-primary-800!" : "bg-surface hover:bg-surface-deep",
                  // i === 0 && props.message.reactions?.length !== 1 && "rounded-r-none",
                  // i > 0 && i < (props.message.reactions?.length ?? 0) - 1 && "rounded-l-none rounded-r-none",
                  // i === (props.message.reactions?.length ?? 0) - 1 && props.message.reactions?.length !== 1 && "rounded-l-none",
               )}
            >
               <Emoji emoji={x.emoji} />
               <div className="box-exact text-white">{x.count}</div>
            </button>
         ))}
      </div>
   );
}

function Emoji(props: { emoji: { name: string; id: string | null } }) {
   const codepoint = useMemo(() => getEmojiCodepoint(props.emoji.name), [props.emoji]);
   const src = useMemo(() => (codepoint ? `${import.meta.env.BASE_URL}emojis/${codepoint}.svg` : undefined), [codepoint]);

   return <img src={src} draggable={false} alt={codepoint} className="size-5 object-contain" />;
}
