import type { MouseEvent } from "react";

import HuginnButton from "./HuginnButton";

export default function EmojiPickerButton(props: { onClick?: (e: MouseEvent<HTMLButtonElement>) => void; isActive?: boolean }) {
   return (
      <HuginnButton
         onClick={props.onClick}
         color={props.isActive ? "primary" : "surface"}
         className="flex size-10 cursor-pointer items-center justify-center rounded-full! p-2"
      >
         <IconMingcuteEmoji2Fill className="text-text size-full" />
      </HuginnButton>
   );
}
