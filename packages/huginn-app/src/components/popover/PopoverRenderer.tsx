import { ColorPickerPanel } from "@components/ColorPicker";
import { usePopover } from "@stores/popoverStore";

import ExpressionPanel from "./ExpressionPanel";
import HuginnPopover from "./HuginnPopover";
import PinnedMessagesPanel from "./PinnedMessagesPanel";

export default function PopoverRenderer() {
   const { popover: expressionPopover, close: closeExpression } = usePopover("expression");
   const { popover: pinnedMessagesPopover, close: closePinnedMessages } = usePopover("pinned_messages");
   const { popover: colorPickerPopover, close: closeColorPicker } = usePopover("color_picker");

   return (
      <>
         <HuginnPopover
            popover={expressionPopover}
            onClose={closeExpression}
            sideGap={0}
            alignGap={8}
            side="left"
            renderChildren={<ExpressionPanel />}
         />
         <HuginnPopover
            popover={pinnedMessagesPopover}
            side="bottom"
            sideGap={-36}
            alignGap={-24}
            onClose={closePinnedMessages}
            renderChildren={<PinnedMessagesPanel />}
         />
         <HuginnPopover
            popover={colorPickerPopover}
            side="bottom"
            sideGap={0}
            alignGap={6}
            onClose={closeColorPicker}
            renderChildren={<ColorPickerPanel />}
         />
      </>
   );
}
