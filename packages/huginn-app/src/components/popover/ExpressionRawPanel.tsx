import HuginnTab from "@components/HuginnTab";
import { useState } from "react";

import EmojiPickerPanel from "./EmojiPickerPanel";
import GifPickerPanel from "./GifPickerPanel";

export function ExpressionRawPanel(props: {
   onEmojiSelect: (emoji: string) => void;
   onGifSelect?: (url: string) => void;
   onTabChange?: (tab: "emoji" | "gif" | "sticker") => void;
   type: "full" | "emoji";
   activePanel?: "emoji" | "gif" | "sticker";
}) {
   const [activePanel, setActivePanel] = useState<string>(props.activePanel || "emoji");

   function handleTabChange(value: string) {
      setActivePanel(value);
      props.onTabChange?.(value as "emoji" | "gif" | "sticker");
   }

   return props.type === "full" ? (
      <HuginnTab value={activePanel} onChange={handleTabChange} className="h-full">
         <HuginnTab.TabList className="bg-surface-void! gap-x-2 p-0! px-2! pt-2!" tabClassName="py-1 w-full">
            <HuginnTab.Tab value="emoji">Emojis</HuginnTab.Tab>
            <HuginnTab.Tab value="gif">GIFs</HuginnTab.Tab>
            <HuginnTab.Tab value="sticker">Stickers</HuginnTab.Tab>
         </HuginnTab.TabList>
         <HuginnTab.TabPanels className="flex h-full w-full overflow-hidden lg:h-120" panelClassName="w-full">
            <HuginnTab.TabPanel value="emoji">
               <EmojiPickerPanel onEmojiSelect={props.onEmojiSelect} />
            </HuginnTab.TabPanel>

            <HuginnTab.TabPanel value="gif">
               <GifPickerPanel onGifSelect={props.onGifSelect} />
            </HuginnTab.TabPanel>
            <HuginnTab.TabPanel value="sticker" className="text-white">
               Soon bro... sooooon...
            </HuginnTab.TabPanel>
         </HuginnTab.TabPanels>
      </HuginnTab>
   ) : (
      <div className="flex h-full w-full overflow-hidden lg:h-120">
         <EmojiPickerPanel onEmojiSelect={props.onEmojiSelect} />
      </div>
   );
}
