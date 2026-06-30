import { usePopover } from "@stores/popoverStore";

import EmojiPickerPanel from "./EmojiPickerPanel";
import HuginnPopover from "./HuginnPopover";
import PinnedMessagesPanel from "./PinnedMessagesPanel";

export default function PopoverRenderer() {
   const { popover: emojiPickerPopover, close: closeEmojiPicker } = usePopover("emoji_picker");
   const { popover: pinnedMessagesPopover, close: closePinnedMessages } = usePopover("pinned_messages");

   return (
      <>
         <HuginnPopover popover={emojiPickerPopover} onClose={closeEmojiPicker} sideGap={12} renderChildren={<EmojiPickerPanel />} />
         <HuginnPopover
            popover={pinnedMessagesPopover}
            align="end"
            side="bottom"
            sideGap={16}
            onClose={closePinnedMessages}
            renderChildren={<PinnedMessagesPanel />}
         />
      </>
   );
}
