import type { Snowflake } from "@huginnjs/shared";

import { useInset } from "@contexts/InsetContext";
import { useChannelStore } from "@stores/channelStore";
import { clsx } from "clsx";
import { useEffect, type MouseEvent, type ReactNode, type RefObject } from "react";

import type { AutocompleteItem, AutocompleteState } from "@/types";

import UserAvatar from "./UserAvatar";

function renderItem(item: AutocompleteItem) {
   switch (item.type) {
      case "user":
         return <UserRow id={item.id} avatarHash={item.avatarHash} username={item.username} displayName={item.displayName} />;
      case "special":
         return <SpecialRow ids={item.ids} label={item.label} description={item.description} />;
      default:
         return null;
   }
}

export function MessageAutocomplete(props: {
   state: AutocompleteState | null;
   items: AutocompleteItem[];
   onSelectIndex: (index: number) => void;
   onSelect?: (item: AutocompleteItem) => void;
   onClose?: () => void;
   editorRef?: RefObject<HTMLDivElement | null>;
   containerRef?: RefObject<HTMLDivElement | null>;
}) {
   const { messageBoxHeight } = useChannelStore();
   const { lastKeyboardHeight, isKeyboardOpen } = useInset();

   useEffect(() => {
      const controller = new AbortController();
      document.addEventListener(
         "click",
         (e) => {
            if (!props.editorRef?.current?.contains(e.target as Node) && !props.containerRef?.current?.contains(e.target as Node)) {
               props.onClose?.();
            }
         },
         { signal: controller.signal },
      );

      return () => controller.abort();
   }, []);

   if (!props.state?.type || props.items.length === 0) return null;

   const userItems = props.items.filter((x) => x.type === "user");
   const specialItems = props.items.filter((x) => x.type === "special");

   function handleSelect(e: MouseEvent, index: number) {
      const target = e.target as Element;
      target.scrollIntoView({ behavior: "instant", block: "center" });
      props.onSelect?.(props.items[index]);
   }

   function handleSelectIndex(index: number) {
      props.onSelectIndex(index);
   }

   return (
      <div
         className="bg-surface-alt border-surface scroll-super-thin absolute right-5 left-5 z-20 flex flex-col overflow-y-scroll rounded-xl border p-2 pr-0"
         ref={props.containerRef}
         style={{
            bottom: messageBoxHeight + 20 + (isKeyboardOpen ? lastKeyboardHeight : 0),
            maxHeight: `min(40vh, calc(100vh - ${messageBoxHeight + 20 + (isKeyboardOpen ? lastKeyboardHeight : 0)}px))`,
         }}
      >
         {userItems.map((item, i) => (
            <BaseRow
               key={item.id}
               index={i}
               selectedIndex={props.state?.selectedIndex || 0}
               onSelectIndex={handleSelectIndex}
               onSelect={handleSelect}
            >
               {renderItem(item)}
            </BaseRow>
         ))}
         {specialItems.length > 0 && userItems.length > 0 && <div className="bg-surface my-2 h-px w-full shrink-0" />}
         {specialItems.map((item, i) => (
            <BaseRow
               key={item.ids[0]}
               index={i + userItems.length}
               selectedIndex={props.state?.selectedIndex || 0}
               onSelectIndex={handleSelectIndex}
               onSelect={handleSelect}
            >
               {renderItem(item)}
            </BaseRow>
         ))}
      </div>
   );
}

function BaseRow(props: {
   children?: ReactNode;
   selectedIndex: number;
   index: number;
   onSelectIndex?: (index: number) => void;
   onSelect?: (e: MouseEvent, index: number) => void;
}) {
   return (
      <button
         className={clsx(props.index === props.selectedIndex && "lg:bg-surface", "active:bg-surface shrink-0 cursor-pointer rounded-lg p-2")}
         onMouseEnter={() => props.onSelectIndex?.(props.index)}
         onClick={(e) => props.onSelect?.(e, props.index)}
         data-keyboard-no-close
         data-index={props.index}
      >
         {props.children}
      </button>
   );
}

function UserRow(props: { id: Snowflake; avatarHash?: string | null; username: string; displayName?: string | null }) {
   return (
      <div className="flex items-center">
         <UserAvatar userId={props.id} avatarHash={props.avatarHash} size={1.5} />
         <div className="ml-2 text-white">{props.displayName || props.username}</div>
         {props.displayName && <div className="ml-auto text-sm text-white/80">{props.username}</div>}
      </div>
   );
}

function SpecialRow(props: { ids: string[]; label: string; description: string }) {
   return (
      <div className="flex items-center">
         <div className="text-white">{props.label}</div>
         <div className="ml-auto text-sm text-white/80">{props.description}</div>
      </div>
   );
}
