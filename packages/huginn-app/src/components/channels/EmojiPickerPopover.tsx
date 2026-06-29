import EmojiPickerButton from "@components/button/EmojiPickerButton";
import HuginnPopover from "@components/popover/HuginnPopover";
import { useState } from "react";

import EmojiPickerPanel from "./EmojiPickerPanel";
import EmojiPickerPopoverPanel from "./EmojiPickerPopoverPanel";

export default function EmojiPickerPopover(props: { onEmojiSelect?: (emoji: string) => void; onOpenChange?: (open: boolean) => void }) {
   const [isOpen, setIsOpen] = useState(false);

   function handleOpenChange(open: boolean) {
      setIsOpen(open);
      props.onOpenChange?.(open);
   }

   return (
      <HuginnPopover onOpenChange={handleOpenChange} open={isOpen}>
         <HuginnPopover.Trigger asChild>
            <EmojiPickerButton isActive={isOpen} />
         </HuginnPopover.Trigger>
         <EmojiPickerPopoverPanel sideGap={12}>
            <EmojiPickerPanel isOpen={isOpen} onEmojiSelect={props.onEmojiSelect} maxWidth={340} maxHeight={480} />
         </EmojiPickerPopoverPanel>
      </HuginnPopover>
   );
}
