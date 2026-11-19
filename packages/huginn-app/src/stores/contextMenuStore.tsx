import { createContext, type MouseEvent, type ReactNode, type RefObject, useContext, useEffect, useMemo, useState } from "react";
import { createStore, useStore } from "zustand";

import type {
   ContextMenuDMChannel,
   ContextMenuDMChannelRecipient,
   ContextMenuExpression,
   ContextMenuMessage,
   ContextMenuRelationship,
   ContextMenuStateProps,
   ContextMenuVoiceElement,
} from "@/types";

const createContextMenuStore = () =>
   createStore(() => ({
      dm_channel: undefined as ContextMenuStateProps<ContextMenuDMChannel> | undefined,
      dm_channel_recipient: undefined as ContextMenuStateProps<ContextMenuDMChannelRecipient> | undefined,
      gif: undefined as ContextMenuStateProps<ContextMenuExpression> | undefined,
      sticker: undefined as ContextMenuStateProps<ContextMenuExpression> | undefined,
      relationship_more: undefined as ContextMenuStateProps<ContextMenuRelationship> | undefined,
      relationship: undefined as ContextMenuStateProps<ContextMenuRelationship> | undefined,
      voice_element: undefined as ContextMenuStateProps<ContextMenuVoiceElement> | undefined,
      message: undefined as ContextMenuStateProps<ContextMenuMessage> | undefined,
   }));

type ContextMenuStore = ReturnType<typeof createContextMenuStore>;
type ContextMenuTypes = ReturnType<ContextMenuStore["getState"]>;
const ContextMenuContext = createContext<ContextMenuStore>(undefined!);
const FocusFallbackContext = createContext<RefObject<HTMLElement | null> | undefined>(undefined);

export function ContextMenuProvider(props: { children?: ReactNode; active?: boolean; focusFallback?: RefObject<HTMLElement | null> }) {
   const [store] = useState(createContextMenuStore);

   useEffect(() => {
      // A keep-mounted popover must not reopen its previous context menu.
      if (props.active === false) store.setState(store.getInitialState(), true);
   }, [props.active, store]);

   return (
      <ContextMenuContext.Provider value={store}>
         <FocusFallbackContext.Provider value={props.focusFallback}>{props.children}</FocusFallbackContext.Provider>
      </ContextMenuContext.Provider>
   );
}

export function useContextMenu<T extends keyof ContextMenuTypes>(type: T) {
   const context = useContext(ContextMenuContext);
   const focusFallback = useContext(FocusFallbackContext);
   const hookStore = useStore(context);

   const data = useMemo(() => hookStore[type]?.contextData, [hookStore[type]]);

   function open(data: NonNullable<ContextMenuTypes[T]>["contextData"], e: MouseEvent<HTMLElement>) {
      e.preventDefault();
      e.stopPropagation();
      const previouslyFocused = e.currentTarget.ownerDocument.activeElement;
      context.setState({
         [type]: {
            isOpen: true,
            contextData: data,
            position: [e.clientX, e.clientY],
            finalFocus: focusFallback
               ? () =>
                    previouslyFocused instanceof HTMLElement && focusFallback.current?.contains(previouslyFocused)
                       ? previouslyFocused
                       : focusFallback.current
               : undefined,
         },
      });
   }

   function close() {
      context.setState((state) => ({ ...state, [type]: { ...state[type], isOpen: false } }));
   }

   return {
      open,
      close,
      context: hookStore[type] as ContextMenuTypes[T],
      data: data as NonNullable<ContextMenuTypes[T]>["contextData"],
   };
}
