import { useIsMobile } from "@hooks/useIsMobile";
import { usePopover } from "@stores/popoverStore";

import { ExpressionRawPanel } from "./ExpressionRawPanel";
import HuginnPopover from "./HuginnPopover";

export default function ExpressionPanel() {
   const { popover, close } = usePopover("expression");
   const isMobile = useIsMobile();

   function handleEmojiSelect(slug: string, unicode?: string) {
      popover?.data?.onEmojiSelect?.(slug, unicode);
      close();
   }

   function handleGifSelect(url: string) {
      popover?.data?.onGifSelect?.(url);
      close();
   }

   return (
      <HuginnPopover.Panel className="bg-surface flex flex-col overflow-hidden rounded-lg" style={{ width: isMobile ? "100%" : 340 }}>
         <ExpressionRawPanel onEmojiSelect={handleEmojiSelect} onGifSelect={handleGifSelect} />
      </HuginnPopover.Panel>
   );
}
