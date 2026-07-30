import type { FavoriteGif } from "@huginn/shared";

import { clientStore, useClient } from "@stores/clientStore";
import { useCallback, useMemo } from "react";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";

export function useFavoriteGifs() {
   const storeFavoriteGifs = useStore(clientStore, (state) => state.userSettings?.favoriteGifs);
   const client = useClient();
   const mutation = useEditSettings();

   const favoriteGifs = useMemo(() => {
      if (!storeFavoriteGifs) return [];
      return storeFavoriteGifs.toSorted((a, b) => b.timestamp - a.timestamp);
   }, [storeFavoriteGifs]);

   const addFavorite = useCallback(
      async (gif: FavoriteGif) => {
         await mutation.mutateAsync({ favoriteGifs: [...(storeFavoriteGifs ?? []).filter((x) => x.url !== gif.url), gif] });
      },
      [client, storeFavoriteGifs],
   );

   const removeFavorite = useCallback(
      async (url: string) => {
         await mutation.mutateAsync({ favoriteGifs: (storeFavoriteGifs ?? []).filter((x) => x.url !== url) });
      },
      [client, storeFavoriteGifs],
   );

   return { favoriteGifs, addFavorite, removeFavorite };
}
