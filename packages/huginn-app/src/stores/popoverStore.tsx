import type { Snowflake } from "@huginn/shared";

import { createContext, type MouseEvent, type ReactNode, useEffect, useEffectEvent } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { PopoverStateProps } from "@/types";

type StoreType = ReturnType<typeof initialStore>;

const initialStore = () => ({
   emoji_picker: undefined as PopoverStateProps<{ onEmojiSelect: (slug: string, unicode?: string) => void }> | undefined,
   pinned_messages: undefined as PopoverStateProps<{ channelId: Snowflake }> | undefined,
});

const store = createStore(
   combine(initialStore(), (set) => ({
      update: (type: keyof StoreType, value: StoreType[typeof type] | ((prev: StoreType[typeof type]) => StoreType[typeof type])) =>
         set((state) => ({
            [type]: typeof value === "function" ? (value as (prev: (typeof state)[typeof type]) => (typeof state)[typeof type])(state[type]) : value,
         })),
   })),
);

const PopoverContext = createContext<typeof store>({} as typeof store);

export function PopoverProvider(props: { children?: ReactNode }) {
   return <PopoverContext.Provider value={store}>{props.children}</PopoverContext.Provider>;
}

export function usePopover<T extends keyof StoreType>(type: T, data?: NonNullable<StoreType[T]>["data"]) {
   const hookStore = useStore(store);

   useEffect(() => {}, [hookStore[type]]);

   function open(e: MouseEvent<HTMLElement>) {
      e.preventDefault();
      e.stopPropagation();
      hookStore.update(type, { isOpen: true, data, anchor: e.currentTarget } as StoreType[T]);
   }

   function close() {
      hookStore.update(type, (prev) => ({ ...prev, isOpen: false, data: undefined }));
   }

   const toggle = useEffectEvent((e: MouseEvent<HTMLElement>) => {
      console.log("toggle popover", type, data, hookStore[type]);
      e.preventDefault();
      e.stopPropagation();
      hookStore.update(
         type,
         (prev) =>
            ({
               isOpen: !prev?.isOpen,
               data,
               anchor: e.currentTarget,
            }) as StoreType[T],
      );
   });

   return {
      open,
      close,
      toggle,
      popover: hookStore[type] as StoreType[T],
   };
}

export function usePopovers() {
   return useStore(store);
}
