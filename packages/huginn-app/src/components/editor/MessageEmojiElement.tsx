import { getEmojiFromSlug, getEmojiId } from "@huginn/shared";
import clsx from "clsx";
import { useMemo } from "react";

export default function MessageEmojiElement(props: { emoji?: string; slug?: string; big?: boolean }) {
   const emoji = useMemo(() => props.emoji ?? (props.slug ? getEmojiFromSlug(props.slug) : undefined), [props.emoji, props.slug]);
   const src = useMemo(() => (emoji ? `${import.meta.env.BASE_URL}emojis/${getEmojiId(emoji)}.svg` : undefined), [emoji]);
   return (
      <div className="inline-block align-baseline">
         <img
            src={src}
            draggable={false}
            data-type="emoji"
            alt={props.emoji}
            className={clsx("inline object-contain align-bottom", props.big ? "size-16" : "size-5.5")}
         />
      </div>
   );
}
