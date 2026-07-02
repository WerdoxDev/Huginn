import EmojiImg from "@components/EmojiImg";
import clsx from "clsx";

export default function MessageEmojiElement(props: { id?: string; slug: string; unicode?: string; big?: boolean }) {
   return (
      <div className={clsx("relative inline-block align-bottom", props.big ? "size-16" : "size-5.5")}>
         <EmojiImg unicode={props.unicode} className={clsx("absolute bottom-0 inline align-bottom", props.big ? "size-16" : "size-5.5")} />
      </div>
   );
}
