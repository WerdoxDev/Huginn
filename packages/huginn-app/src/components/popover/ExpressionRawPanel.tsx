import HuginnTab from "@components/HuginnTab";

import EmojiPickerPanel from "./EmojiPickerPanel";
import GifPickerPanel from "./GifPickerPanel";

export function ExpressionRawPanel(props: { onEmojiSelect: (emoji: string) => void; onGifSelect?: (url: string) => void }) {
   return (
      <HuginnTab>
         <HuginnTab.TabList className="gap-x-2 bg-zinc-900! p-0! px-2! pt-0! lg:pt-2!" tabClassName="py-1 w-full">
            <HuginnTab.Tab value="emoji">Emojis</HuginnTab.Tab>
            <HuginnTab.Tab value="gif">GIFs</HuginnTab.Tab>
            <HuginnTab.Tab value="sticker">Stickers</HuginnTab.Tab>
         </HuginnTab.TabList>
         <HuginnTab.TabPanels className="flex h-120 w-full overflow-hidden" panelClassName="w-full">
            <HuginnTab.TabPanel value="emoji">
               <EmojiPickerPanel onEmojiSelect={props.onEmojiSelect} />
            </HuginnTab.TabPanel>
            <HuginnTab.TabPanel value="gif">
               <GifPickerPanel onGifSelect={props.onGifSelect} />
            </HuginnTab.TabPanel>
            <HuginnTab.TabPanel value="sticker">{/* <StickerPickerPanel onStickerSelect={props.onStickerSelect} /> */}</HuginnTab.TabPanel>
         </HuginnTab.TabPanels>
      </HuginnTab>
   );
}
