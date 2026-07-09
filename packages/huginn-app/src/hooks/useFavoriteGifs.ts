import type { FavoriteGif } from "@huginn/shared";

import { clientStore, useClient } from "@stores/clientStore";
import { useCallback } from "react";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";

export function useFavoriteGifs() {
   const favoriteGifs = useStore(clientStore, (state) => state.userSettings?.favoriteGifs);
   const client = useClient();
   const mutation = useEditSettings();

   const toggleFavorite = useCallback(
      async (gif: FavoriteGif) => {
         await mutation.mutateAsync({ favoriteGifs: [...(favoriteGifs ?? []).filter((x) => x.url !== gif.url), gif] });
      },
      [client, favoriteGifs],
   );

   return { favoriteGifs, toggleFavorite };
}
