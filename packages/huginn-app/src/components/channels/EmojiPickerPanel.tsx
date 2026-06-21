import type { Range } from "@tanstack/react-virtual";

import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnInput from "@components/input/HuginnInput";
import Tooltip from "@components/tooltip/Tooltip";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsMobile } from "@hooks/useIsMobile";
import { getEmojiFromHexcode, getEmojiId, getEmojis, type NormalizedEmoji } from "@huginn/shared";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import emojiMessages from "emojibase-data/en/messages.json";
import emojiMeta from "emojibase-data/meta/groups.json";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { SelectItem } from "@/types";

import emojiMap from "@/assets/emoji-map.json";
import emojiSheet from "@/assets/emoji-sheet.png";

const RECENT_MAX = 32;
const RECENT_GROUP_ID = -1;

const RECENT_EMOJIS_KEY = "recent-emojis";

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

type Input = {
   search: string;
};

function getRecentEmojis(): string[] {
   const recent = JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) ?? "[]") as string[];
   return recent;
}

function saveRecentEmoji(hexcode: string) {
   const prev = getRecentEmojis();
   const next = [hexcode, ...prev.filter((h) => h !== hexcode)].slice(0, RECENT_MAX);
   localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(next));
}

function getGroupName(groupId: number) {
   if (groupId === RECENT_GROUP_ID) return "Recently Used";
   return (groupNames[groupId] ?? "misc")
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
}

const groupNames: Record<number, string> = Object.fromEntries(
   Object.entries(emojiMeta.groups).map(([id, key]) => [Number(id), emojiMessages.groups[Number(id)].message ?? key]),
);

const toneOptions: SelectItem<number>[] = [
   {
      text: "",
      icon: <div className="size-6 rounded-md bg-[#F9DD72]" />,
      value: 0,
   },
   {
      text: "",
      icon: <div className="size-6 rounded-md bg-[#F3DFD0]" />,
      value: 1,
   },
   {
      text: "",
      icon: <div className="size-6 rounded-md bg-[#EED3A8]" />,
      value: 2,
   },
   {
      text: "",
      icon: <div className="size-6 rounded-md bg-[#CEAD8C]" />,
      value: 3,
   },
   {
      text: "",
      icon: <div className="size-6 rounded-md bg-[#A8805D]" />,
      value: 4,
   },
   {
      text: "",
      icon: <div className="size-6 rounded-md bg-[#765541]" />,
      value: 5,
   },
];

const groupIcons: Record<number, ReactNode> = {
   [RECENT_GROUP_ID]: <IconMingcuteHistoryAnticlockwiseFill className="size-6" />,
   0: <IconMingcuteEmoji2Fill className="size-6" />,
   1: <IconMingcuteWaveHandFill className="size-6" />,
   3: <IconMingcuteCatFill className="size-6" />,
   4: <IconMingcuteForkFill className="size-6" />,
   5: <IconMingcuteAirplaneFill className="size-6" />,
   6: <IconMingcuteBasketballFill className="size-6" />,
   7: <IconMingcuteHat2Fill className="size-6" />,
   8: <IconMingcuteDiamondSquareFill className="size-6" />,
   9: <IconMingcuteFlag4Fill className="size-6" />,
};

export default function EmojiPickerPanel(props: {
   isOpen?: boolean;
   onEmojiSelect?: (emoji: string) => void;
   maxWidth?: number;
   maxHeight?: number;
}) {
   const { register, values } = useHuginnForm<Input>();
   const parentRef = useRef<HTMLDivElement>(null);
   const categoryScrollRef = useRef<HTMLDivElement>(null);
   const activeStickyIndexRef = useRef(0);
   const [activeGroupId, setActiveGroupId] = useState<number | null>(0);
   const [recentEmojiIds, setRecentEmojiIds] = useState(getRecentEmojis());
   const [selectedTone, setSelectedTone] = useState<SelectItem<number>>(toneOptions[0]);
   const isMobile = useIsMobile();

   const groupedEmojis = useMemo(() => {
      const groups: Record<number, NormalizedEmoji[]> = {};

      if (recentEmojiIds.length > 0) {
         groups[RECENT_GROUP_ID] = recentEmojiIds.flatMap((hexcode) => {
            const emoji = getEmojiFromHexcode(hexcode);
            return emoji ? [{ ...emoji, group: RECENT_GROUP_ID }] : [];
         });
      }

      for (const emoji of getEmojis()) {
         if (emoji.skinTone !== selectedTone.value && emoji.skinTone !== null) continue;
         // Put the indicators in "Symbols" and exclude "Components"
         const group = emoji.group === undefined ? 8 : emoji.group === 2 ? undefined : emoji.group;
         if (group === undefined) continue;
         (groups[group] ??= []).push(emoji);
      }

      return groups;
   }, [recentEmojiIds, selectedTone]);

   const allRows = useMemo<VirtualRow[]>(() => {
      const result: VirtualRow[] = [];
      for (const [groupId, emojis] of Object.entries(groupedEmojis).toSorted(([a], [b]) => Number(a) - Number(b))) {
         result.push({ type: "header", name: getGroupName(Number(groupId)), groupId: Number(groupId) });
         for (let i = 0; i < emojis.length; i += 8) {
            result.push({ type: "emojis", emojis: emojis.slice(i, i + 8) });
         }
      }
      return result;
   }, [groupedEmojis]);

   const rows = useMemo<VirtualRow[]>(() => {
      const query = values.search?.trim().toLowerCase();
      if (!query) return allRows;

      const matched = Object.values(groupedEmojis)
         .flat()
         .filter((e) => e.group !== RECENT_GROUP_ID && e.slugs.some((slug) => slug.includes(query)));

      const result: VirtualRow[] = [];
      for (let i = 0; i < matched.length; i += 8) {
         result.push({ type: "emojis", emojis: matched.slice(i, i + 8) });
      }
      return result.length > 0 ? result : [];
   }, [allRows, groupedEmojis, values.search]);

   const stickyIndexes = useMemo(() => rows.flatMap((row, i) => (row.type === "header" ? [i] : [])), [rows]);
   const stickyIndexSet = useMemo(() => new Set(stickyIndexes), [stickyIndexes]);
   const [lastHoveredEmoji, setLastHoveredEmoji] = useState<NormalizedEmoji | null>(rows.find((x) => x.type === "emojis")?.emojis[0] ?? null);

   const groupHeaderIndexMap = useMemo(() => Object.fromEntries(rows.flatMap((row, i) => (row.type === "header" ? [[row.groupId, i]] : []))), [rows]);

   const groupRepresentatives = useMemo(
      () =>
         Object.keys(groupedEmojis)
            .toSorted((a, b) => Number(a) - Number(b))
            .map((groupId) => ({
               groupId: Number(groupId),
               name: getGroupName(Number(groupId)),
            })),
      [groupedEmojis],
   );

   const isSticky = (index?: number) => index !== undefined && stickyIndexSet.has(index);
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

   function handleCategoryClick(groupId: number) {
      const headerIndex = groupHeaderIndexMap[groupId];
      if (headerIndex === undefined) return;
      setActiveGroupId(groupId);
      virtualizer.scrollToIndex(headerIndex, { align: "start", behavior: "instant" });
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
      activeCategoryButton?.scrollIntoView({ inline: "center", behavior: "smooth" });
      if (!activeCategoryButton) return;
   }, [activeGroupId]);

   return (
      <div className="flex h-full flex-col overflow-hidden" data-ignore-swipe style={{ maxHeight: props.maxHeight }}>
         <div className={clsx("flex w-full items-center gap-x-2 p-2", isMobile && "pt-0.5")}>
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
                  </HuginnSelect.ItemsWrapper>
               </HuginnSelect.List>
            </HuginnSelect>
         </div>
         <div className="bg-surface h-px shrink-0" />
         <div className="flex flex-col overflow-hidden">
            <div
               className="scroll-hidden flex h-13 w-full shrink-0 gap-x-1 overflow-x-auto overflow-y-hidden px-2 py-2"
               ref={categoryScrollRef}
               style={{ maxWidth: props.maxWidth }}
            >
               {groupRepresentatives.map(({ groupId, name }) => (
                  <Tooltip key={groupId}>
                     <Tooltip.Trigger
                        onClick={() => handleCategoryClick(groupId)}
                        data-group-id={groupId}
                        className={clsx(
                           "relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-all",
                           activeGroupId === groupId
                              ? "bg-surface text-white opacity-100"
                              : "text-text/60 hover:bg-surface/60 opacity-60 hover:-translate-y-0.5 hover:text-white hover:opacity-100",
                        )}
                     >
                        {groupIcons[groupId]}
                        <div
                           className={clsx(
                              "absolute -bottom-1 h-0.5 w-3 rounded-full transition-colors",
                              activeGroupId === groupId ? "bg-text" : "bg-transparent",
                           )}
                        />
                     </Tooltip.Trigger>
                     <Tooltip.Content side="bottom">{name}</Tooltip.Content>
                  </Tooltip>
               ))}
            </div>
            <div className="bg-surface h-px w-full shrink-0" />
            {rows.length > 0 ? (
               <div className="flex w-full flex-col overflow-hidden" style={{ maxWidth: props.maxWidth }}>
                  <div ref={parentRef} className="scroll-thin relative h-full overflow-x-hidden overflow-y-scroll pb-2.5 pl-2.5 select-none">
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
                                    <div className="bg-surface-deep flex items-center gap-x-2 pt-2.5 pb-2.5 text-white lg:bg-zinc-900">
                                       {groupIcons[row.groupId]}
                                       <div className="text-sm font-bold">{row.name}</div>
                                       <div className="bg-surface ml-auto rounded-sm p-1 text-xs">{groupedEmojis[row.groupId].length}</div>
                                    </div>
                                 ) : (
                                    <div className="grid grid-cols-8 place-items-center">
                                       {row.emojis.map((entry) => (
                                          <button
                                             key={entry.hexcode}
                                             type="button"
                                             className={clsx(
                                                "z-10 flex size-10 cursor-pointer items-center justify-center rounded-md transition-transform",
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
                  {!isMobile && (
                     <>
                        <div className="bg-surface h-px shrink-0" />
                        {lastHoveredEmoji && (
                           <div className="flex h-12 w-full shrink-0 items-center gap-x-2 px-3.5">
                              <Emoji emoji={lastHoveredEmoji.emoji} size={32} />
                              <div className="text-sm text-white">{lastHoveredEmoji.slugs.join(" ")}</div>
                           </div>
                        )}
                     </>
                  )}
               </div>
            ) : (
               <div
                  className="text-text/70 flex w-full flex-col items-center justify-center gap-2 py-10 text-center"
                  style={{ maxWidth: props.maxWidth }}
               >
                  <IconMingcuteSadFill className="size-10" />
                  <div>No emojis found</div>
               </div>
            )}
         </div>
      </div>
   );
}

function Emoji(props: { emoji: string; size: number }) {
   const styles = useMemo(() => getEmojiSprite(getEmojiId(props.emoji)), [props.emoji]);

   return <div style={{ ...styles, width: props.size, height: props.size }} className="shrink-0" />;
}

function getEmojiSprite(id: string) {
   const entry = emojiMap.emojis[id.toLowerCase() as keyof typeof emojiMap.emojis];
   if (!entry) return null;

   const { cols, rows } = emojiMap.meta;

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
