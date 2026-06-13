import { getEmojiFromSlug, getEmojiId } from "@huginn/shared";
import { useMemo } from "react";
import { type RenderElementProps } from "slate-react";

import type { EmojiElement } from "@/index";

export default function PreviewEmojiElement(props: RenderElementProps) {
   const element = props.element as EmojiElement;
   const emoji = useMemo(() => element.emoji ?? (element.slug ? getEmojiFromSlug(element.slug) : undefined), [element.emoji, element.slug]);
   const src = useMemo(() => `${import.meta.env.BASE_URL}emojis/${getEmojiId(emoji)}.svg`, [emoji]);
   return (
      <div {...props.attributes} contentEditable={false} className="inline-block align-middle [&>span]:hidden">
         <img src={src} draggable={false} data-type="emoji" alt={element.emoji} className="size-5 object-contain" />
         {props.children}
      </div>
   );
}
