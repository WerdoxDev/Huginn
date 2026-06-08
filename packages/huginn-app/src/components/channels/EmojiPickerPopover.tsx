import type { Range } from "@tanstack/react-virtual";

import HuginnButton from "@components/button/HuginnButton";
import HuginnPopover from "@components/popover/HuginnPopover";
import { getEmojiId } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import { useCallback, useMemo, useRef, useState } from "react";
import emojiData from "unicode-emoji-json/data-by-group.json";

export default function EmojiPickerPopover(props: { onEmojiSelect?: (emoji: string) => void }) {
   const [isOpen, setIsOpen] = useState(false);
   return (
      <HuginnPopover onOpenChange={setIsOpen} open={isOpen}>
         <HuginnPopover.Trigger asChild>
            <HuginnButton
               color="primary"
               className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full!"
               type="button"
               // onClick={() => sendMessage(MessageFlags.NONE)}
            >
               <IconMingcuteEmoji2Fill className="text-text size-5" />
            </HuginnButton>
         </HuginnPopover.Trigger>
         <HuginnPopover.Panel sideGap={10} className="bg-surface flex max-h-100 w-85 flex-col overflow-hidden rounded-lg pr-0">
            <EmojiPickerPanel isOpen={isOpen} onEmojiSelect={props.onEmojiSelect} />
         </HuginnPopover.Panel>
      </HuginnPopover>
   );
}

type HeaderRow = {
   type: "header";
   name: string;
};

type EmojiRow = {
   type: "emojis";
   emojis: { slug: string; emoji: string }[];
};

type VirtualRow = HeaderRow | EmojiRow;

function EmojiPickerPanel(props: { isOpen?: boolean; onEmojiSelect?: (emoji: string) => void }) {
   const parentRef = useRef<HTMLDivElement>(null);
   const activeStickyIndexRef = useRef(0);

   // Flatten emojiData into header rows + emoji chunk rows (8 per row)
   const rows = useMemo<VirtualRow[]>(() => {
      const result: VirtualRow[] = [];
      for (const group of Object.values(emojiData)) {
         result.push({ type: "header", name: group.name });
         const emojis = Object.values(group.emojis);
         for (let i = 0; i < emojis.length; i += 8) {
            result.push({ type: "emojis", emojis: emojis.slice(i, i + 8) });
         }
      }
      return result;
   }, []);

   const [lastHoveredEmoji, setLastHoveredEmoji] = useState<{ slug: string; emoji: string }>(rows.find((x) => x.type === "emojis")!.emojis[0]);

   // Indexes of all header rows
   const stickyIndexes = useMemo(() => rows.reduce<number[]>((acc, row, i) => (row.type === "header" ? [...acc, i] : acc), []), [rows]);

   const isSticky = (index: number) => stickyIndexes.includes(index);
   const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;

   const virtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: (index) => (rows[index].type === "header" ? 40 : 40),
      // overscan: 6,
      rangeExtractor: useCallback(
         (range: Range) => {
            // Track which sticky header is currently active
            activeStickyIndexRef.current = [...stickyIndexes].reverse().find((index) => range.startIndex >= index) ?? 0;

            // Always include the active sticky index in the rendered set
            const next = new Set([activeStickyIndexRef.current, ...defaultRangeExtractor(range)]);

            return [...next].sort((a, b) => a - b);
         },
         [stickyIndexes],
      ),
   });

   return (
      <div className="flex flex-col overflow-hidden">
         <div ref={parentRef} className="scroll-thin relative h-full w-full overflow-x-hidden overflow-y-scroll pb-2.5 pl-2.5 select-none">
            <div style={{ height: virtualizer.getTotalSize() }} className="relative w-full">
               {virtualizer.getVirtualItems().map((virtualItem) => {
                  const row = rows[virtualItem.index];
                  const sticky = isSticky(virtualItem.index);
                  const activeSticky = isActiveSticky(virtualItem.index);

                  return (
                     <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                           // Active sticky header: position sticky so it "pins" at top
                           // All other items (including non-active headers): position absolute
                           position: activeSticky ? "sticky" : "absolute",
                           transform: activeSticky ? undefined : `translateY(${virtualItem.start}px)`,
                           top: 0,
                           left: 0,
                           width: "100%",
                           ...(sticky ? { zIndex: 1 } : {}),
                        }}
                     >
                        {row.type === "header" ? (
                           <div className="bg-surface-deep pt-2.5 pb-2.5 text-sm font-bold text-white">{row.name}</div>
                        ) : (
                           <div className="grid grid-cols-8 place-items-center">
                              {row.emojis.map((entry) => (
                                 <button
                                    key={entry.slug}
                                    type="button"
                                    className={clsx(
                                       "flex h-10 w-10 cursor-pointer items-center justify-center rounded transition-colors",
                                       lastHoveredEmoji?.slug === entry.slug ? "bg-surface" : "",
                                    )}
                                    onClick={() => props.onEmojiSelect?.(entry.emoji)}
                                    onMouseEnter={() => setLastHoveredEmoji(entry)}
                                 >
                                    <Emoji emoji={entry.emoji} />
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>
         <div className="bg-surface h-px shrink-0" />
         <div className="flex w-full shrink-0 items-center gap-x-2 px-4 py-2">
            <Emoji emoji={lastHoveredEmoji?.emoji || ""} />
            <div className="text-white">:{lastHoveredEmoji?.slug || ""}:</div>
         </div>
      </div>
   );
}

function Emoji(props: { emoji: string }) {
   const client = useClient();
   const src = useMemo(() => client?.cdn.emoji(getEmojiId(props.emoji)), [props.emoji]);

   return <img draggable={false} loading="lazy" src={src} alt={props.emoji} className="size-7" />;
}
