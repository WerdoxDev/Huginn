import type { Snowflake } from "@huginn/shared";

import { useEffect, useMemo, useReducer, type KeyboardEvent } from "react";

import type { AppUser, AutocompleteItem, AutocompleteState, AutocompleteType } from "@/types";

import { useChannelRecipients } from "./api-hooks/channelHooks";

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
      // case "SET_QUERY":
      //    return { ...state, query: action.query };
      case "SET_SELECTED":
         return { ...state, selectedIndex: action.index };
      case "MOVE_SELECTION":
         const length = action.itemCount || 1;
         return { ...state, selectedIndex: (state.selectedIndex + action.delta + length) % length };
      case "CLOSE":
         return initialState;
      default:
         return state;
   }
}

const USER_SPECIAL_ITEMS: AutocompleteItem[] = [
   { type: "special", id: "all", label: "@all", description: "Mention everyone in this channel" },
   { type: "special", id: "everyone", label: "@everyone", description: "Mention everyone in this channel" },
];

function userMatcher(query: string, users: AppUser[]): AutocompleteItem[] {
   const q = query.toLowerCase();
   const specials = USER_SPECIAL_ITEMS.filter((item) => item.id.includes(q));
   const filteredUsers = users
      .filter((user) => user.username!.toLowerCase().includes(q))
      .map((user) => ({ type: "user" as const, id: user.id, name: user.username!, avatarHash: user.avatar }));
   return [...filteredUsers, ...specials];
}

export function useMessageBoxAutocomplete(options: { channelId?: Snowflake; onSelect?: (item: AutocompleteItem) => void }) {
   const [state, dispatch] = useReducer(autocompleteReducer, initialState);
   const { recipients } = useChannelRecipients(options.channelId, undefined, true);

   const items = useMemo(() => {
      if (!state.type) return [];
      switch (state.type) {
         case "user":
            return userMatcher(state.query, recipients);
         default:
            return [];
      }
   }, [state.type, state.query]);

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

   function autocompleteKeyIntercept(event: KeyboardEvent) {
      if (!state.isOpen) return false;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
         dispatch({ type: "MOVE_SELECTION", delta: event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0, itemCount: items.length });
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

   return { autocompleteKeyIntercept, state, items, handleSet, handleClose };
}
