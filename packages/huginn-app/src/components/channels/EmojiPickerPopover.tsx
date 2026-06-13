import EmojiPickerButton from "@components/button/EmojiPickerButton";
import HuginnPopover from "@components/popover/HuginnPopover";
import { useState } from "react";

import EmojiPickerPanel from "./EmojiPickerPanel";

export default function EmojiPickerPopover(props: { onEmojiSelect?: (emoji: string) => void; onOpenChange?: (open: boolean) => void }) {
   const [isOpen, setIsOpen] = useState(false);

   function handleOpenChange(open: boolean) {
      setIsOpen(open);
      props.onOpenChange?.(open);
   }

   return (
      <HuginnPopover onOpenChange={handleOpenChange} open={isOpen}>
         <HuginnPopover.Trigger asChild>
            <EmojiPickerButton />
         </HuginnPopover.Trigger>
         <HuginnPopover.Panel sideGap={12} className="bg-surface flex flex-col overflow-hidden rounded-lg pr-0">
            <EmojiPickerPanel isOpen={isOpen} onEmojiSelect={props.onEmojiSelect} maxWidth={340} maxHeight={480} />
         </HuginnPopover.Panel>
      </HuginnPopover>
   );
}
