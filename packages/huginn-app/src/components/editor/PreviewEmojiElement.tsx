import EmojiImg from "@components/EmojiImg";
import { type RenderElementProps } from "slate-react";

import type { EmojiElement } from "@/index";

export default function PreviewEmojiElement(props: RenderElementProps) {
   const element = props.element as EmojiElement;
   return (
      <div {...props.attributes} contentEditable={false} className="inline-block align-baseline [&>span]:hidden">
         <EmojiImg unicode={element.unicode} className="inline size-5.5 align-bottom" />
         {props.children}
      </div>
   );
}
