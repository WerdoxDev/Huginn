import { getEmojiFromSlug, getEmojiId } from "@huginn/shared";
import { useMemo } from "react";

export default function MessageEmojiElement(props: { emoji?: string; slug?: string; big?: boolean }) {
   const emoji = useMemo(() => props.emoji ?? (props.slug ? getEmojiFromSlug(props.slug) : undefined), [props.emoji, props.slug]);
   const src = useMemo(() => (emoji ? `${import.meta.env.BASE_URL}emojis/${getEmojiId(emoji)}.svg` : undefined), [emoji]);
   return (
      <div className="inline-block align-middle">
         <img src={src} draggable={false} data-type="emoji" alt={props.emoji} className={props.big ? "size-16" : "size-5"} />
      </div>
   );
}
