import { ChannelType, type Snowflake } from "@huginnjs/shared";
import { useEffect, useMemo, useReducer, useRef, type KeyboardEvent } from "react";

import type { AppDirectChannel, AppUser, AutocompleteItem, AutocompleteSpecialItem, AutocompleteState, AutocompleteType } from "@/types";

import { useChannel, useChannelRecipients } from "./api-hooks/channelHooks";

const initialState: AutocompleteState = {
   isOpen: false,
   type: null,
   query: "",
   selectedIndex: 0,
};

type AutocompleteAction =
   | { type: "SET"; autocompleteType: AutocompleteType; query: string }
   // | { type: "SET_QUERY"; query: string }
   | { type: "SET_ITEMS"; items: AutocompleteItem[] }
   | { type: "SET_SELECTED"; index: number }
   | { type: "MOVE_SELECTION"; delta: number; itemCount: number }
   | { type: "CLOSE" };

function autocompleteReducer(state: AutocompleteState, action: AutocompleteAction): AutocompleteState {
   switch (action.type) {
      case "SET":
         return { ...initialState, isOpen: true, type: action.autocompleteType, query: action.query };
      case "SET_SELECTED":
         return { ...state, selectedIndex: action.index };
      // case "MOVE_SELECTION":
      //    const length = action.itemCount || 1;
      //    return { ...state, selectedIndex: (state.selectedIndex + action.delta + length) % length };
      case "CLOSE":
         return initialState;
      default:
         return state;
   }
}

const USER_SPECIAL_ITEMS: AutocompleteSpecialItem[] = [
   {
      type: "special",
      ids: ["everyone", "all"],
      channelType: ChannelType.GROUP_DM,
      label: "@everyone, @all",
      description: "Mentions everyone",
   },
   {
      type: "special",
      ids: ["owner", "leader"],
      channelType: ChannelType.GROUP_DM,
      label: "@leader, @owner",
      description: "Mentions the channel owner",
   },
];

function userMatcher(query: string, users: AppUser[], channel?: AppDirectChannel): AutocompleteItem[] {
   const q = query.toLowerCase();
   const specials = USER_SPECIAL_ITEMS.filter((item) => item.ids.some((id) => id.includes(q) && channel && item.channelType === channel.type));
   const filteredUsers = users
      .filter((user) => user.username!.toLowerCase().includes(q))
      .map((user) => ({
         type: "user" as const,
         id: user.id,
         username: user.username!,
         displayName: user.originalDisplayName,
         avatarHash: user.avatar,
      }));
   return [...filteredUsers, ...specials];
}

export function useMessageBoxAutocomplete(options: { channelId?: Snowflake; onSelect?: (item: AutocompleteItem) => void }) {
   const [state, dispatch] = useReducer(autocompleteReducer, initialState);
   const channel = useChannel(options.channelId);
   const containerRef = useRef<HTMLDivElement | null>(null);
   const { recipients } = useChannelRecipients(options.channelId, undefined, true);

   const items = useMemo(() => {
      if (!state.type) return [];
      switch (state.type) {
         case "user":
            return userMatcher(state.query, recipients, channel);
         default:
            return [];
      }
   }, [state.type, state.query, channel]);

   function handleSet(type: AutocompleteType, query: string) {
      dispatch({ type: "SET", autocompleteType: type, query });
   }

   function handleClose() {
      dispatch({ type: "CLOSE" });
   }

   function handleSelect() {
      const item = items[state.selectedIndex];
      if (!item) return;

      options.onSelect?.(item);
      handleClose();
   }

   function handleSelectIndex(index: number) {
      const item = items[index];
      if (!item) return;

      dispatch({ type: "SET_SELECTED", index: index });
   }

   function autocompleteKeyIntercept(event: KeyboardEvent) {
      if (!state.isOpen) return false;
      if (items.length === 0) return false;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
         const newIndex = (state.selectedIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
         dispatch({ type: "SET_SELECTED", index: newIndex });

         const itemElement = containerRef.current?.querySelector<HTMLButtonElement>(`[data-index="${newIndex}"]`);
         itemElement?.scrollIntoView({ block: "center", behavior: "instant" });

         return true;
      } else if (event.key === "Enter" || event.key === "Tab") {
         handleSelect();
         return true;
      } else if (event.key === "Escape") {
         handleClose();
         return true;
      }
      return false;
   }

   return { autocompleteKeyIntercept, state, items, handleSet, handleClose, handleSelectIndex, handleSelect, containerRef };
}
