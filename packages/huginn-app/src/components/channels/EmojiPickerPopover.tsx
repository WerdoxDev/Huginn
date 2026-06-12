import type { Range } from "@tanstack/react-virtual";

import HuginnButton from "@components/button/HuginnButton";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnInput from "@components/input/HuginnInput";
import HuginnPopover from "@components/popover/HuginnPopover";
import Tooltip from "@components/tooltip/Tooltip";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { getEmojiFromHexcode, getEmojiId, getEmojis } from "@huginn/shared";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import emojiMessagesData from "emojibase-data/en/messages.json";
import emojiMeta from "emojibase-data/meta/groups.json";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SelectItem } from "@/types";

import emojiMap from "@/assets/emoji-map.json";
import emojiSheet from "@/assets/emoji-sheet.png";

const PICKER_WIDTH = 340;
const CATEGORIES_WIDTH = 52;
const HORIZONTAL_GAP = 1;
const RECENT_MAX = 32;
const RECENT_GROUP_ID = -1;

const RECENT_EMOJIS_KEY = "recent-emojis";

function getRecentEmojis(): string[] {
   const recent = JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) ?? "[]") as string[];
   return recent;
}

function saveRecentEmoji(hexcode: string) {
   const prev = getRecentEmojis();
   const next = [hexcode, ...prev.filter((h) => h !== hexcode)].slice(0, RECENT_MAX);
   localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(next));
}

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
         <HuginnPopover.Panel sideGap={10} className="bg-surface flex max-h-100 flex-col overflow-hidden rounded-lg pr-0">
            <EmojiPickerPanel isOpen={isOpen} onEmojiSelect={props.onEmojiSelect} />
         </HuginnPopover.Panel>
      </HuginnPopover>
   );
}

type HeaderRow = {
   type: "header";
   name: string;
   groupId: number;
};

type EmojiRow = {
   type: "emojis";
   emojis: NormalizedEmoji[];
};

type VirtualRow = HeaderRow | EmojiRow;
type NormalizedEmoji = { slugs: string[]; emoji: string; hexcode: string };

type Input = {
   search: string;
};

const groupNames: Record<number, string> = Object.fromEntries(
   Object.entries(emojiMeta.groups).map(([id, key]) => [Number(id), emojiMessagesData.groups[Number(id)].message ?? key]),
);

const toneOptions: SelectItem<number>[] = [
   {
      text: "",
      icon: <Emoji emoji="👋" size={20} />,
      value: 0,
   },
   {
      text: "",
      icon: <Emoji emoji="👋🏻" size={20} />,
      value: 1,
   },
   {
      text: "",
      icon: <Emoji emoji="👋🏼" size={20} />,
      value: 2,
   },
   {
      text: "",
      icon: <Emoji emoji="👋🏽" size={20} />,
      value: 3,
   },
   {
      text: "",
      icon: <Emoji emoji="👋🏾" size={20} />,
      value: 4,
   },
   {
      text: "",
      icon: <Emoji emoji="👋🏿" size={20} />,
      value: 5,
   },
];

function EmojiPickerPanel(props: { isOpen?: boolean; onEmojiSelect?: (emoji: string) => void }) {
   const { register, values } = useHuginnForm<Input>();
   const parentRef = useRef<HTMLDivElement>(null);
   const categoryScrollRef = useRef<HTMLDivElement>(null);
   const activeStickyIndexRef = useRef(0);
   const [activeGroupId, setActiveGroupId] = useState<number | null>(0);
   const [recentEmojiIds, setRecentEmojiIds] = useState(getRecentEmojis());
   const [selectedTone, setSelectedTone] = useState<SelectItem<number>>(toneOptions[0]);

   const groupedEmojis = useMemo(() => {
      const groups: Record<number, NormalizedEmoji[]> = {};
      if (recentEmojiIds.length > 0) groups[RECENT_GROUP_ID] = [];
      if (groups[RECENT_GROUP_ID]) {
         for (const hexcode of recentEmojiIds) {
            const emoji = getEmojiFromHexcode(hexcode);
            if (!emoji) continue;
            groups[RECENT_GROUP_ID].push(emoji);
         }
      }

      for (const emoji of getEmojis().filter((x) => x.skinTone === selectedTone.value || x.skinTone === null)) {
         const group = groups[emoji.group];
         if (group) group.push(emoji);
         else groups[emoji.group] = [emoji];
      }

      return groups;
   }, [recentEmojiIds, selectedTone]);

   const allRows = useMemo<VirtualRow[]>(() => {
      const result: VirtualRow[] = [];

      for (const [groupId, emojis] of Object.entries(groupedEmojis).toSorted(([a], [b]) => Number(a) - Number(b))) {
         const groupName = getGroupName(Number(groupId));
         result.push({ type: "header", name: groupName, groupId: Number(groupId) });
         for (let i = 0; i < emojis.length; i += 8) {
            result.push({ type: "emojis", emojis: emojis.slice(i, i + 8) });
         }
      }
      return result;
   }, [groupedEmojis, recentEmojiIds]);

   const rows = useMemo<VirtualRow[]>(() => {
      const query = values.search?.trim().toLowerCase();
      if (!query) return allRows;

      const matched = Object.entries(groupedEmojis)
         .filter((x) => Number(x[0]) !== RECENT_GROUP_ID)
         .flatMap(([, emojis]) => emojis)
         .filter((e) => e.slugs.some((slug) => slug.includes(query)));

      // ;

      if (matched.length === 0) return [];

      const result: VirtualRow[] = [];
      for (let i = 0; i < matched.length; i += 8) {
         result.push({ type: "emojis", emojis: matched.slice(i, i + 8) });
      }
      return result;
   }, [allRows, groupedEmojis, values.search]);

   const [lastHoveredEmoji, setLastHoveredEmoji] = useState<NormalizedEmoji | null>(rows.find((x) => x.type === "emojis")?.emojis[0] ?? null);
   const stickyIndexes = useMemo(() => rows.reduce<number[]>((acc, row, i) => (row.type === "header" ? [...acc, i] : acc), []), [rows]);

   const groupHeaderIndexMap = useMemo(() => {
      const map: Record<number, number> = {};
      rows.forEach((row, i) => {
         if (row.type === "header") map[row.groupId] = i;
      });
      return map;
   }, [rows]);

   const groupRepresentatives = useMemo(
      () =>
         Object.entries(groupedEmojis)
            .toSorted(([a], [b]) => Number(a) - Number(b))
            .map(([groupId, emojis]) => ({
               groupId: Number(groupId),
               emoji: emojis[0]?.emoji,
               name: getGroupName(Number(groupId)),
            })),
      [groupedEmojis],
   );

   const isSticky = (index?: number) => index !== undefined && stickyIndexes.includes(index);
   const isActiveSticky = (index?: number) => activeStickyIndexRef.current === index;

   const virtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: (index) => (rows[index].type === "header" ? 40 : 40),
      rangeExtractor: useCallback(
         (range: Range) => {
            const newActiveSticky = [...stickyIndexes].reverse().find((index) => range.startIndex >= index) ?? -1;
            activeStickyIndexRef.current = newActiveSticky;

            const activeRow = rows[newActiveSticky];
            if (activeRow?.type === "header") setActiveGroupId(activeRow.groupId);

            const next = new Set([newActiveSticky, ...defaultRangeExtractor(range)]);
            return [...next].sort((a, b) => a - b);
         },
         [stickyIndexes, rows],
      ),
   });

   function getGroupName(groupId: number) {
      if (groupId === RECENT_GROUP_ID) return "Recently Used";
      return (groupNames[groupId] ?? "misc")
         .split(" ")
         .map((word) => word[0].toUpperCase() + word.slice(1))
         .join(" ");
   }

   function handleCategoryClick(groupId: number) {
      const headerIndex = groupHeaderIndexMap[groupId];
      if (headerIndex === undefined) return;
      setActiveGroupId(groupId);
      virtualizer.scrollToIndex(headerIndex, { align: "start" });
   }

   function handleEmojiClick(emoji: NormalizedEmoji) {
      saveRecentEmoji(emoji.hexcode);
      setRecentEmojiIds(getRecentEmojis());
      props.onEmojiSelect?.(emoji.slugs[0]);
   }

   useEffect(() => {
      if (!props.isOpen) return;
      virtualizer.scrollToIndex(0, { align: "start" });
      // -1 is recently used
      setActiveGroupId(values.search ? null : -1);
   }, [values.search]);

   useEffect(() => {
      if (rows.length !== 0) setLastHoveredEmoji(rows.find((x) => x.type === "emojis")!.emojis[0]);
   }, [rows]);

   useEffect(() => {
      if (!categoryScrollRef.current) return;
      const activeCategoryButton = categoryScrollRef.current.querySelector<HTMLButtonElement>(`[data-group-id="${activeGroupId}"]`);
      activeCategoryButton?.scrollIntoView({ block: "center", behavior: "smooth" });
      if (!activeCategoryButton) return;
   }, [activeGroupId]);

   return (
      <div className="flex flex-col overflow-hidden">
         <div className="flex w-full items-center gap-x-1 p-1">
            {/* <div className=""> */}
            <HuginnInput {...register("search")} placeholder={lastHoveredEmoji?.slugs.join(" ")} className="w-full">
               <HuginnInput.Wrapper>
                  <IconMingcuteSearch2Fill className="text-text ml-2 size-6" />
                  <HuginnInput.Input />
               </HuginnInput.Wrapper>
            </HuginnInput>
            <HuginnSelect selected={selectedTone} onChange={setSelectedTone} className="w-max">
               <HuginnSelect.List
                  hideArrow
                  className="flex h-10 w-10! items-center justify-center rounded-md!"
                  triggerClassName="h-full justify-center"
               >
                  <HuginnSelect.ItemsWrapper className="rounded-md!">
                     {toneOptions.map((x) => (
                        <HuginnSelect.Item key={x.value} item={x} hideSelected className="size-10 justify-center" />
                     ))}
                     {/* <HuginnSelect.Item value={{ text: "All Emojis", value: "all" }} /> */}
                  </HuginnSelect.ItemsWrapper>
               </HuginnSelect.List>
            </HuginnSelect>
            {/* </div> */}
         </div>
         <div className="bg-surface h-px shrink-0" />
         {/* {rows.length !== 0 ? ( */}
         <div className="flex overflow-hidden">
            <div
               className="scroll-hidden flex shrink-0 flex-col gap-y-1 overflow-x-hidden overflow-y-auto px-2 py-2"
               ref={categoryScrollRef}
               style={{ width: CATEGORIES_WIDTH }}
            >
               {groupRepresentatives.map(({ groupId, emoji, name }) => (
                  <Tooltip key={groupId}>
                     <Tooltip.Trigger
                        onClick={() => handleCategoryClick(groupId)}
                        data-group-id={groupId}
                        className={clsx(
                           "flex size-9 w-full shrink-0 cursor-pointer items-center justify-center rounded-md transition-[opacity_color]",
                           activeGroupId === groupId
                              ? "bg-surface text-white opacity-100"
                              : "text-text/60 hover:bg-surface/60 opacity-60 hover:text-white hover:opacity-100",
                        )}
                     >
                        {groupId === RECENT_GROUP_ID ? (
                           <IconMingcuteHistoryAnticlockwiseLine className="size-6" />
                        ) : (
                           <Emoji emoji={emoji} size={26} />
                        )}
                     </Tooltip.Trigger>
                     <Tooltip.Content side="right">{name}</Tooltip.Content>
                  </Tooltip>
               ))}
            </div>
            <div className="bg-surface shrink-0" style={{ width: HORIZONTAL_GAP }} />
            {rows.length > 0 ? (
               <div className="flex w-full flex-col" style={{ width: PICKER_WIDTH }}>
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
                                             key={entry.hexcode}
                                             type="button"
                                             className={clsx(
                                                "flex size-10 cursor-pointer items-center justify-center rounded-md",
                                                lastHoveredEmoji?.hexcode === entry.hexcode ? "bg-surface" : "",
                                             )}
                                             onClick={() => handleEmojiClick(entry)}
                                             onMouseEnter={() => setLastHoveredEmoji(entry)}
                                          >
                                             <Emoji emoji={entry.emoji} size={32} />
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
                     <div className="flex h-12 w-full shrink-0 items-center gap-x-2 px-3.5">
                        <Emoji emoji={lastHoveredEmoji.emoji} size={32} />
                        <div className="text-sm text-white">{lastHoveredEmoji.slugs.join(" ")}</div>
                     </div>
                  )}
               </div>
            ) : (
               <div className="text-text/70 flex w-full flex-col items-center justify-center gap-2 py-10 text-center" style={{ width: PICKER_WIDTH }}>
                  <IconMingcuteSadFill className="size-10" />
                  <div>No emojis found</div>
               </div>
            )}
         </div>
         {/* ) : ( */}

         {/* )} */}
      </div>
   );
}

function Emoji(props: { emoji: string; size: number }) {
   const styles = useMemo(() => getEmojiSprite(getEmojiId(props.emoji)), [props.emoji]);

   return <div style={{ ...styles, width: props.size, height: props.size }} className="shrink-0" />;
}

export function getEmojiSprite(id: string) {
   const entry = emojiMap.emojis[id.toLowerCase() as keyof typeof emojiMap.emojis];
   if (!entry) return null;

   const { cols, rows, cellSize } = emojiMap.meta;

   return {
      display: "inline-block",
      // width: 32,
      // height: 32,
      backgroundImage: `url('${emojiSheet}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition:
         `${cols === 1 ? 0 : ((entry.col / (cols - 1)) * 100).toFixed(4)}% ` + `${rows === 1 ? 0 : ((entry.row / (rows - 1)) * 100).toFixed(4)}%`,
   };
}
