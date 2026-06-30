import { getEmojiCodepoint } from "@huginn/shared";
import clsx from "clsx";
import { useMemo } from "react";

export default function MessageEmojiElement(props: { id?: string; slug: string; unicode?: string; big?: boolean }) {
   const codepoint = useMemo(() => (props.unicode ? getEmojiCodepoint(props.unicode) : undefined), [props.unicode, props.id]);
   const src = useMemo(() => (codepoint ? `${import.meta.env.BASE_URL}emojis/${codepoint}.svg` : undefined), [codepoint]);
   return (
      <div className={clsx("relative inline-block align-bottom", props.big ? "size-16" : "size-5.5")}>
         <img
            src={src}
            draggable={false}
            alt={props.unicode}
            className={clsx("absolute bottom-0 inline object-contain align-bottom", props.big ? "size-16" : "size-5.5")}
         />
      </div>
   );
}
