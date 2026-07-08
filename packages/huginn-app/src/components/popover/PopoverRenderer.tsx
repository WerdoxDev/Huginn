import { usePopover } from "@stores/popoverStore";

import ExpressionPanel from "./ExpressionPanel";
import HuginnPopover from "./HuginnPopover";
import PinnedMessagesPanel from "./PinnedMessagesPanel";

export default function PopoverRenderer() {
   const { popover: expressionPopover, close: closeExpression } = usePopover("expression");
   const { popover: pinnedMessagesPopover, close: closePinnedMessages } = usePopover("pinned_messages");

   return (
      <>
         <HuginnPopover popover={expressionPopover} onClose={closeExpression} sideGap={12} renderChildren={<ExpressionPanel />} />
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
