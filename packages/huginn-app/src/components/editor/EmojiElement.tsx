import { useClient } from "@stores/clientStore";
import { useEffect, useMemo } from "react";
import { ReactEditor, useEditor, useFocused, useSelected, useSlateStatic, type RenderElementProps } from "slate-react";

import type { EmojiElement } from "@/index";

export default function EmojiElement(props: RenderElementProps) {
   const editor = useSlateStatic();
   const selected = useSelected();
   const focused = useFocused();

   // useEffect(() => {
   //    console.log("EmojiElement selected:", selected);
   //    console.log("EmojiElement focused:", focused);

   //    const abortController = new AbortController();
   //    document.addEventListener(
   //       "selectionchange",
   //       (e) => {

   //       },
   //       { signal: abortController.signal },
   //    );
   //    return () => abortController.abort();
   // }, [selected, focused]);

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
