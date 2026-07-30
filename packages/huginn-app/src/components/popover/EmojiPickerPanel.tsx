import type { Range } from "@tanstack/react-virtual";

import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnInput from "@components/input/HuginnInput";
import PickerMessage from "@components/PickerMessage";
import Tooltip from "@components/tooltip/Tooltip";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsMobile } from "@hooks/useIsMobile";
import { useRecentEmojis } from "@hooks/useRecentEmojis";
import { type Emoji, getAllEmojis, getEmojiByCodepoint } from "@huginnjs/shared";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { clsx } from "clsx";
import emojiMessages from "emojibase-data/en/messages.json";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { SelectItem } from "@/types";

import emojiSheet from "@/assets/emoji-sheet.webp";
import emojiData from "@/assets/emojis.json";

const RECENT_GROUP_ID = -1;

type HeaderRow = {
   type: "header";
   name: string;
   groupId: number;
};

type EmojiRow = {
   type: "emojis";
   emojis: Emoji[];
};

type VirtualRow = HeaderRow | EmojiRow;

type Input = {
   search: string;
};

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

const EMOJI_PER_ROW = 8;

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

export default function EmojiPickerPanel(props: { isOpen?: boolean; onEmojiSelect?: (slug: string, unicode?: string) => void }) {
   const { register, values } = useHuginnForm<Input>();
   const parentRef = useRef<HTMLDivElement>(null);
   const categoryScrollRef = useRef<HTMLDivElement>(null);
   const activeStickyIndexRef = useRef(0);
   const [activeGroupId, setActiveGroupId] = useState<number | null>(0);
   const { recentEmojis, addRecentEmoji } = useRecentEmojis();
   const [selectedTone, setSelectedTone] = useState<SelectItem<number>>(toneOptions[0]);
   const isMobile = useIsMobile();
   const groupNames: Record<number, string> = useMemo(() => {
      return Object.fromEntries(emojiMessages.groups.map((x) => [Number(x.order), x.message]));
   }, []);

   const groupedEmojis = useMemo(() => {
      const groups: Record<number, Emoji[]> = {};

      if (recentEmojis.length > 0) {
         groups[RECENT_GROUP_ID] = recentEmojis.flatMap((emoji) => {
            return emoji ? [{ ...emoji, group: RECENT_GROUP_ID }] : [];
         });
      }

      for (const emoji of getAllEmojis()) {
         if (emoji.tone !== selectedTone.value && emoji.tone !== undefined) continue;
         // Put the indicators in "Symbols" and exclude "Components"
         const group = emoji.group === undefined ? 8 : emoji.group === 2 ? undefined : emoji.group;
         if (group === undefined) continue;
         (groups[group] ??= []).push(emoji);
      }

      return groups;
   }, [recentEmojis, selectedTone]);

   const allRows = useMemo<VirtualRow[]>(() => {
      const result: VirtualRow[] = [];
      for (const [groupId, emojis] of Object.entries(groupedEmojis).toSorted(([a], [b]) => Number(a) - Number(b))) {
         result.push({ type: "header", name: getGroupName(Number(groupId)), groupId: Number(groupId) });
         for (let i = 0; i < emojis.length; i += EMOJI_PER_ROW) {
            result.push({ type: "emojis", emojis: emojis.slice(i, i + EMOJI_PER_ROW) });
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
      for (let i = 0; i < matched.length; i += EMOJI_PER_ROW) {
         result.push({ type: "emojis", emojis: matched.slice(i, i + EMOJI_PER_ROW) });
      }
      return result.length > 0 ? result : [];
   }, [allRows, groupedEmojis, values.search]);

   const stickyIndexes = useMemo(() => rows.flatMap((row, i) => (row.type === "header" ? [i] : [])), [rows]);
   const stickyIndexSet = useMemo(() => new Set(stickyIndexes), [stickyIndexes]);
   const [lastHoveredEmoji, setLastHoveredEmoji] = useState<Emoji | null>(rows.find((x) => x.type === "emojis")?.emojis[0] ?? null);

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
      virtualizer.scrollToIndex(headerIndex, { align: "start", behavior: "instant" });
   }

   function handleEmojiClick(emoji: Emoji) {
      addRecentEmoji(emoji.slugs[0]);
      props.onEmojiSelect?.(emoji.slugs[0], emoji.unicode);
   }

   useEffect(() => {
      if (!props.isOpen) return;
      virtualizer.scrollToIndex(0, { align: "start" });
      // -1 is recently used
      setActiveGroupId(values.search ? null : RECENT_GROUP_ID);
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
      <div className={clsx("flex h-full w-full flex-col overflow-hidden", isMobile && "bg-surface-void rounded-t-xl")} data-ignore-swipe>
         <div className={clsx("flex w-full items-center gap-x-2 p-2")}>
            <HuginnInput {...register("search")} placeholder={lastHoveredEmoji?.slugs.join(" ")} className="w-full">
               <HuginnInput.Wrapper className="bg-surface-deep!">
                  <IconMingcuteSearch2Fill className="text-text ml-2 size-6" />
                  <HuginnInput.Input data-keyboard-no-close />
               </HuginnInput.Wrapper>
            </HuginnInput>
            <HuginnSelect selected={selectedTone} onChange={setSelectedTone} className="w-max">
               <HuginnSelect.List
                  hideArrow
                  className="bg-surface-deep! flex h-10 w-10! items-center justify-center rounded-md!"
                  triggerClassName="h-full justify-center"
               >
                  <HuginnSelect.ItemsWrapper className="rounded-md!">
                     {toneOptions.map((x) => (
                        <HuginnSelect.Item key={x.value} item={x} hideSelected={!isMobile} className="lg:size-10 lg:justify-center" />
                     ))}
                  </HuginnSelect.ItemsWrapper>
               </HuginnSelect.List>
            </HuginnSelect>
         </div>
         <div className="bg-surface-alt h-px shrink-0" />
         <div className="flex h-full flex-col overflow-hidden">
            <div
               className="scroll-hidden flex h-13 w-full shrink-0 touch-auto gap-x-1 overflow-x-auto overflow-y-hidden px-2 py-2"
               onTouchStart={(e) => e.stopPropagation()}
               ref={categoryScrollRef}
            >
               {groupRepresentatives.map(({ groupId, name }) => (
                  <Tooltip key={groupId}>
                     <Tooltip.Trigger
                        onClick={() => handleCategoryClick(groupId)}
                        data-group-id={groupId}
                        className={clsx(
                           "relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-all",
                           activeGroupId === groupId
                              ? "bg-surface-alt text-white opacity-100"
                              : "text-text/60 hover:bg-surface-deep opacity-60 hover:-translate-y-0.5 hover:text-white hover:opacity-100",
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
            <div className="bg-surface-alt h-px w-full shrink-0" />
            {rows.length > 0 ? (
               <div className="flex h-full flex-col overflow-hidden">
                  <div ref={parentRef} className="scroll-super-thin relative h-full overflow-x-hidden overflow-y-scroll pb-2 pl-2 select-none">
                     <div style={{ height: virtualizer.getTotalSize() }} className={clsx("relative w-full", values.search && "first:mt-2")}>
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
                                    <div className="bg-surface-void flex items-center gap-x-2 pt-2 pb-2 text-white">
                                       {groupIcons[row.groupId]}
                                       <div className="text-sm font-bold">{row.name}</div>
                                       <div className="bg-surface-alt ml-auto rounded-sm p-1 text-xs">{groupedEmojis[row.groupId].length}</div>
                                    </div>
                                 ) : (
                                    <div className="grid grid-cols-8 place-items-center">
                                       {row.emojis.map((entry) => (
                                          <button
                                             key={entry.slugs[0]}
                                             type="button"
                                             className={clsx(
                                                "z-10 flex size-10 cursor-pointer items-center justify-center rounded-md transition-transform",
                                                lastHoveredEmoji?.slugs[0] === entry.slugs[0] ? "bg-surface-alt" : "",
                                             )}
                                             onClick={() => handleEmojiClick(entry)}
                                             onMouseEnter={() => setLastHoveredEmoji(entry)}
                                          >
                                             <Emoji codepoint={entry.codepoint} size={32} />
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
                        <div className="bg-surface-alt h-px shrink-0" />
                        {lastHoveredEmoji && (
                           <div className="flex h-12 w-full shrink-0 items-center gap-x-2 px-3.5">
                              <Emoji codepoint={lastHoveredEmoji.codepoint} size={32} />
                              <div className="text-sm text-white">{lastHoveredEmoji.slugs.join(" ")}</div>
                           </div>
                        )}
                     </>
                  )}
               </div>
            ) : (
               <PickerMessage className="h-full w-full" icon={<IconMingcuteSadFill className="size-8" />}>
                  No emojis found
               </PickerMessage>
            )}
         </div>
      </div>
   );
}

function Emoji(props: { codepoint: string; size: number }) {
   const styles = useMemo(() => getEmojiSprite(props.codepoint), [props.codepoint]);

   return <div style={{ ...styles, width: props.size, height: props.size }} className="shrink-0" />;
}

function getEmojiSprite(codepoint: string) {
   const emoji = getEmojiByCodepoint(codepoint);
   if (!emoji || !emoji.position) return;

   const { cols, rows } = emojiData.meta;

   return {
      display: "inline-block",
      // width: 32,
      // height: 32,
      backgroundImage: `url('${emojiSheet}')`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition:
         `${cols === 1 ? 0 : ((emoji.position.col / (cols - 1)) * 100).toFixed(4)}% ` +
         `${rows === 1 ? 0 : ((emoji.position.row / (rows - 1)) * 100).toFixed(4)}%`,
   };
}
