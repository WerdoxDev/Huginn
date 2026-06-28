import { getEmojiById } from "@huginn/shared";
import clsx from "clsx";
import { useMemo } from "react";

export default function MessageEmojiElement(props: { id: string; slug?: string; unicode?: string; big?: boolean }) {
   const emoji = useMemo(() => getEmojiById(props.id), [props.id]);
   const src = useMemo(() => (emoji ? `${import.meta.env.BASE_URL}emojis/${emoji.id}.svg` : undefined), [emoji]);
   return (
      <div className={clsx("relative inline-block align-bottom", props.big ? "size-16" : "size-5.5")}>
         <img
            src={src}
            draggable={false}
            data-type="emoji"
            alt={props.unicode}
            className={clsx("absolute bottom-0 inline object-contain align-bottom", props.big ? "size-16" : "size-5.5")}
         />
      </div>
   );
}
