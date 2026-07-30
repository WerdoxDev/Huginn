import { getEmojiCodepoint } from "@huginnjs/shared";
import { clsx } from "clsx";
import { useMemo } from "react";

export default function EmojiImg(props: { unicode?: string; className?: string }) {
   const codepoint = useMemo(() => (props.unicode ? getEmojiCodepoint(props.unicode) : undefined), [props.unicode]);
   const src = useMemo(() => `${import.meta.env.BASE_URL}emojis/${codepoint}.svg`, [codepoint]);

   return <img src={src} className={clsx(props.className, "object-contain")} alt={props.unicode} draggable={false} />;
}
