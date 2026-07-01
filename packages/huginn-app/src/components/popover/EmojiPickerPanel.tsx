import { useIsMobile } from "@hooks/useIsMobile";
import { usePopover } from "@stores/popoverStore";

import EmojiPickerRawPanel from "./EmojiPickerRawPanel";
import HuginnPopover from "./HuginnPopover";

export default function EmojiPickerPanel() {
   const { popover, close } = usePopover("emoji_picker");
   const isMobile = useIsMobile();

   function handleEmojiSelect(slug: string, unicode?: string) {
      popover?.data?.onEmojiSelect(slug, unicode);
      close();
   }

   return (
      <HuginnPopover.Panel className="bg-surface flex flex-col overflow-hidden rounded-lg">
         <EmojiPickerRawPanel maxWidth={isMobile ? undefined : 340} maxHeight={480} onEmojiSelect={handleEmojiSelect} />
      </HuginnPopover.Panel>
   );
}
