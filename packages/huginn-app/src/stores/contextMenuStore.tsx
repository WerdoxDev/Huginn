import { createContext, type MouseEvent, type ReactNode, useContext, useMemo } from "react";
import { createStore, useStore } from "zustand";

import type {
   ContextMenuDMChannel,
   ContextMenuDMChannelRecipient,
   ContextMenuGif,
   ContextMenuMessage,
   ContextMenuRelationship,
   ContextMenuStateProps,
   ContextMenuVoiceElement,
} from "@/types";

const store = createStore(() => ({
   dm_channel: undefined as ContextMenuStateProps<ContextMenuDMChannel> | undefined,
   dm_channel_recipient: undefined as ContextMenuStateProps<ContextMenuDMChannelRecipient> | undefined,
   gif: undefined as ContextMenuStateProps<ContextMenuGif> | undefined,
   relationship_more: undefined as ContextMenuStateProps<ContextMenuRelationship> | undefined,
   relationship: undefined as ContextMenuStateProps<ContextMenuRelationship> | undefined,
   voice_element: undefined as ContextMenuStateProps<ContextMenuVoiceElement> | undefined,
   message: undefined as ContextMenuStateProps<ContextMenuMessage> | undefined,
}));

type ContextMenuTypes = ReturnType<typeof store.getState>;
const ContextMenuContext = createContext<typeof store>({} as typeof store);

export function ContextMenuProvider(props: { children?: ReactNode }) {
   return <ContextMenuContext.Provider value={store}>{props.children}</ContextMenuContext.Provider>;
}

export function useContextMenu<T extends keyof ContextMenuTypes>(type: T) {
   const context = useContext(ContextMenuContext);
   const hookStore = useStore(context);

   const data = useMemo(() => hookStore[type]?.contextData, [hookStore[type]]);

   function open(data: NonNullable<ContextMenuTypes[T]>["contextData"], e: MouseEvent<HTMLElement>) {
      e.preventDefault();
      e.stopPropagation();
      store.setState({
         [type]: { isOpen: true, contextData: data, position: [e.clientX, e.clientY] },
      });
   }

   function close() {
      store.setState((state) => ({ ...state, [type]: { ...state[type], isOpen: false } }));
   }

   return {
      open,
      close,
      context: hookStore[type] as ContextMenuTypes[T],
      data: data as NonNullable<ContextMenuTypes[T]>["contextData"],
   };
}
