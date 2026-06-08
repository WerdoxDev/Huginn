import { useClient } from "@stores/clientStore";
import { useMemo } from "react";
import { type RenderElementProps } from "slate-react";

import type { EmojiElement } from "@/index";

export default function MessageEmojiElement(props: { emojiId: string; emoji: string }) {
   // const element = props.element as EmojiElement;
   const client = useClient();
   const src = useMemo(() => client?.cdn.emoji(props.emojiId), [props.emojiId]);
   return (
      <div className="inline-block align-sub [&>span]:hidden">
         {/* <Emoji data={data} id={element.emojiId} size={20} /> */}
         <img src={src} data-type="emoji" alt={props.emojiId} className="size-5 object-contain" />
      </div>
   );
}
