import { useClient } from "@stores/clientStore";
import { useMemo } from "react";
import { type RenderElementProps } from "slate-react";

import type { EmojiElement } from "@/index";

export default function PreviewEmojiElement(props: RenderElementProps) {
   const element = props.element as EmojiElement;
   const client = useClient();
   const src = useMemo(() => client?.cdn.emoji(element.emojiId), [element.emojiId]);
   return (
      <div {...props.attributes} contentEditable={false} className="inline-block align-sub [&>span]:hidden">
         {/* <Emoji data={data} id={element.emojiId} size={20} /> */}
         <img src={src} data-type="emoji" alt={element.emojiId} className="size-5 object-contain" />
         {props.children}
      </div>
   );
}
