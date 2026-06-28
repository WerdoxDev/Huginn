import { getEmojiById } from "@huginn/shared";
import { useMemo } from "react";
import { type RenderElementProps } from "slate-react";

import type { EmojiElement } from "@/index";

export default function PreviewEmojiElement(props: RenderElementProps) {
   const element = props.element as EmojiElement;
   const emoji = useMemo(() => getEmojiById(element.id), [element.id]);
   const src = useMemo(() => `${import.meta.env.BASE_URL}emojis/${emoji?.id}.svg`, [emoji]);
   return (
      <div {...props.attributes} contentEditable={false} className="inline-block align-baseline">
         <img
            src={src}
            draggable={false}
            data-type="emoji"
            alt={emoji?.unicode || element.slug || emoji?.slugs[0]}
            className="inline size-5.5 object-contain align-bottom"
         />
         {props.children}
      </div>
   );
}
