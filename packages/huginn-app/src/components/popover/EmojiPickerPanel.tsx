import { usePopover } from "@stores/popoverStore";

import EmojiPickerRawPanel from "./EmojiPickerRawPanel";
import HuginnPopover from "./HuginnPopover";

export default function EmojiPickerPanel() {
   const { popover, close } = usePopover("emoji_picker");

   function handleEmojiSelect(slug: string, unicode?: string) {
      popover?.data?.onEmojiSelect(slug, unicode);
      close();
   }

   return (
      <HuginnPopover.Panel className="bg-surface flex flex-col overflow-hidden rounded-lg pr-0">
         <EmojiPickerRawPanel maxWidth={340} maxHeight={480} onEmojiSelect={handleEmojiSelect} />
      </HuginnPopover.Panel>
   );
}
