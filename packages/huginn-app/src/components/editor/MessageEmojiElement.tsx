import { getEmojiFromSlug, getEmojiId } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useMemo } from "react";

export default function MessageEmojiElement(props: { emoji?: string; slug?: string }) {
   const client = useClient();
   const emoji = useMemo(() => props.emoji ?? (props.slug ? getEmojiFromSlug(props.slug) : undefined), [props.emoji, props.slug]);
   const src = useMemo(() => (emoji ? client?.cdn.emoji(getEmojiId(emoji)) : undefined), [emoji]);
   return (
      <div className="inline-block align-sub">
         <img src={src} draggable={false} data-type="emoji" alt={props.emoji} className="size-5 object-contain" />
      </div>
   );
}
