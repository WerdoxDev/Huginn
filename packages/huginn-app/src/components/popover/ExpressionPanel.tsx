import { useIsMobile } from "@hooks/useIsMobile";
import { usePopover } from "@stores/popoverStore";

import { ExpressionRawPanel } from "./ExpressionRawPanel";
import HuginnPopover from "./HuginnPopover";

export default function ExpressionPanel() {
   const { popover, close, setData } = usePopover("expression");
   const isMobile = useIsMobile();

   function handleEmojiSelect(slug: string, unicode?: string) {
      popover?.data?.onEmojiSelect?.(slug, unicode);
      close();
   }

   function handleGifSelect(url: string) {
      popover?.data?.onGifSelect?.(url);
      close();
   }

   function handleTabChange(tab: "emoji" | "gif" | "sticker") {
      setData({ ...popover?.data, type: popover?.data?.type || "full", activeTab: tab });
   }

   return (
      <HuginnPopover.Panel
         className="bg-surface flex h-120 max-h-full min-h-0 flex-col overflow-hidden rounded-lg"
         style={{ width: isMobile ? "100%" : 340 }}
      >
         <ExpressionRawPanel
            onEmojiSelect={handleEmojiSelect}
            onGifSelect={handleGifSelect}
            type={popover?.data?.type || "full"}
            activePanel={popover?.data?.activeTab}
            onTabChange={handleTabChange}
         />
      </HuginnPopover.Panel>
   );
}
