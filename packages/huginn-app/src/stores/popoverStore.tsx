import type { Snowflake } from "@huginn/shared";

import { createContext, type MouseEvent, type ReactNode, useEffect } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { PopoverStateProps } from "@/types";

type StoreType = ReturnType<typeof initialStore>;

const initialStore = () => ({
   expression: undefined as
      | PopoverStateProps<{
           type: "full" | "emoji";
           onEmojiSelect?: (slug: string, unicode?: string) => void;
           onGifSelect?: (url: string) => void;
           messageId?: Snowflake;
        }>
      | undefined,
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

export function usePopover<T extends keyof StoreType>(type: T) {
   const hookStore = useStore(store);

   useEffect(() => {}, [hookStore[type]]);

   function open(e: MouseEvent<HTMLElement>, data?: NonNullable<StoreType[T]>["data"]) {
      e.preventDefault();
      e.stopPropagation();
      const boundingRect = e.currentTarget.getBoundingClientRect();
      hookStore.update(type, { isOpen: true, data, position: [boundingRect.x, boundingRect.y] } as StoreType[T]);
   }

   function close() {
      hookStore.update(type, (prev) => ({ ...prev, isOpen: false, data: undefined }));
   }

   function toggle(e: MouseEvent<HTMLElement>, data?: NonNullable<StoreType[T]>["data"]) {
      e.preventDefault();
      e.stopPropagation();
      const boundingRect = e.currentTarget.getBoundingClientRect();
      hookStore.update(
         type,
         (prev) =>
            ({
               isOpen: !prev?.isOpen,
               data,
               position: [boundingRect.x, boundingRect.y],
            }) as StoreType[T],
      );
   }

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
