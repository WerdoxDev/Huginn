import type { Range } from "@tanstack/react-virtual";

import HuginnButton from "@components/button/HuginnButton";
import HuginnInput from "@components/input/HuginnInput";
import HuginnPopover from "@components/popover/HuginnPopover";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { getEmojiId } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import emojiData from "unicode-emoji-json/data-by-group.json";

export default function EmojiPickerPopover(props: { onEmojiSelect?: (emoji: string) => void; onOpenChange?: (open: boolean) => void }) {
   const [isOpen, setIsOpen] = useState(false);

   function handleOpenChange(open: boolean) {
      setIsOpen(open);
      props.onOpenChange?.(open);
   }

   return (
      <HuginnPopover onOpenChange={handleOpenChange} open={isOpen}>
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

type Input = {
   search: string;
};

function EmojiPickerPanel(props: { isOpen?: boolean; onEmojiSelect?: (emoji: string) => void }) {
   const { register, values } = useHuginnForm<Input>();
   const parentRef = useRef<HTMLDivElement>(null);
   const activeStickyIndexRef = useRef(0);

   // Flatten emojiData into header rows + emoji chunk rows (8 per row)
   const allRows = useMemo<VirtualRow[]>(() => {
      const result: VirtualRow[] = [];
      for (const group of Object.values(emojiData)) {
         result.push({ type: "header", name: group.name });
         const emojis = Object.values(group.emojis).map((x) => ({ ...x, slug: `:${x.slug}:` }));
         for (let i = 0; i < emojis.length; i += 8) {
            result.push({ type: "emojis", emojis: emojis.slice(i, i + 8) });
         }
      }
      return result;
   }, []);

   const rows = useMemo<VirtualRow[]>(() => {
      const query = values.search?.trim().toLowerCase();
      if (!query) return allRows;

      // Filter emojis by slug match, then re-chunk into rows of 8 (no headers when searching)
      const matched = Object.values(emojiData)
         .flatMap((group) => Object.values(group.emojis))
         .map((x) => ({ ...x, slug: `:${x.slug}:` }))
         .filter((e) => e.slug.includes(query));

      if (matched.length === 0) return [];

      const result: VirtualRow[] = [];
      for (let i = 0; i < matched.length; i += 8) {
         result.push({ type: "emojis", emojis: matched.slice(i, i + 8) });
      }
      return result;
   }, [allRows, values.search]);

   const [lastHoveredEmoji, setLastHoveredEmoji] = useState<{ slug: string; emoji: string }>(allRows.find((x) => x.type === "emojis")!.emojis[0]);

   // Indexes of all header rows
   const stickyIndexes = useMemo(() => rows.reduce<number[]>((acc, row, i) => (row.type === "header" ? [...acc, i] : acc), []), [rows]);

   const isSticky = (index?: number) => index !== undefined && stickyIndexes.includes(index);
   const isActiveSticky = (index?: number) => activeStickyIndexRef.current === index;

   const virtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: (index) => (rows[index].type === "header" ? 40 : 40),
      rangeExtractor: useCallback(
         (range: Range) => {
            activeStickyIndexRef.current = [...stickyIndexes].reverse().find((index) => range.startIndex >= index) ?? -1;
            const next = new Set([activeStickyIndexRef.current, ...defaultRangeExtractor(range)]);
            return [...next].sort((a, b) => a - b);
         },
         [stickyIndexes],
      ),
   });

   // Scroll back to top whenever the search query changes
   useEffect(() => {
      if (!props.isOpen) return;
      virtualizer.scrollToIndex(0, { align: "start" });
   }, [values.search]);

   return (
      <div className="flex flex-col overflow-hidden">
         <div className="p-1">
            <HuginnInput {...register("search")} placeholder={lastHoveredEmoji.slug}>
               <HuginnInput.Wrapper>
                  <IconMingcuteSearch2Fill className="text-text ml-2 size-6" />
                  <HuginnInput.Input />
               </HuginnInput.Wrapper>
            </HuginnInput>
         </div>
         <div className="bg-surface h-px shrink-0" />
         {rows.length !== 0 ? (
            <>
               <div ref={parentRef} className="scroll-thin relative h-full w-full overflow-x-hidden overflow-y-scroll pb-2.5 pl-2.5 select-none">
                  <div style={{ height: virtualizer.getTotalSize() }} className={clsx("relative w-full", values.search && "first:mt-2.5")}>
                     {virtualizer.getVirtualItems().map((virtualItem) => {
                        if (!virtualItem) return null;
                        const row = rows[virtualItem?.index];
                        const sticky = isSticky(virtualItem?.index);
                        const activeSticky = isActiveSticky(virtualItem?.index);

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
                                          onClick={() => props.onEmojiSelect?.(entry.slug)}
                                          onMouseEnter={() => setLastHoveredEmoji(entry)}
                                       >
                                          <Emoji emoji={entry.emoji} slug={entry.slug} />
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
               {lastHoveredEmoji && (
                  <div className="flex w-full shrink-0 items-center gap-x-2 px-4 py-2">
                     <Emoji emoji={lastHoveredEmoji.emoji} slug={lastHoveredEmoji.slug} />
                     <div className="text-white">{lastHoveredEmoji.slug}</div>
                  </div>
               )}
            </>
         ) : (
            <div className="text-text/70 flex w-full flex-col items-center justify-center gap-2 py-10 text-center">
               <IconMingcuteSadFill className="size-10" />
               <div>No emojis found</div>
            </div>
         )}
      </div>
   );
}

function Emoji(props: { emoji: string; slug: string }) {
   const client = useClient();
   const src = useMemo(() => client?.cdn.emoji(getEmojiId(props.emoji)), [props.emoji]);

   return <img draggable={false} loading="lazy" src={src} alt={props.slug} className="size-7" />;
}
