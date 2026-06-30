import { getEmojiCodepoint } from "@huginn/shared";
import { useMemo } from "react";
import { type RenderElementProps } from "slate-react";

import type { EmojiElement } from "@/index";

export default function PreviewEmojiElement(props: RenderElementProps) {
   const element = props.element as EmojiElement;
   const codepoint = useMemo(() => (element.unicode ? getEmojiCodepoint(element.unicode) : undefined), [element.unicode]);
   const src = useMemo(() => `${import.meta.env.BASE_URL}emojis/${codepoint}.svg`, [codepoint]);
   return (
      <div {...props.attributes} contentEditable={false} className="inline-block align-baseline">
         <img src={src} draggable={false} data-type="emoji" alt={element.unicode} className="inline size-5.5 object-contain align-bottom" />
         {props.children}
      </div>
   );
}
