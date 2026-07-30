import { useFavoriteGifs } from "@hooks/useFavoriteGifs";
import { useContextMenu } from "@stores/contextMenuStore";

import type { ContextMenuGif } from "@/types";

import ContextMenu from "./ContextMenu";

export default function GifContextMenu() {
   const { data } = useContextMenu("gif");

   if (!data) return;

   return <GifFavoriteContextMenuItem gif={data} />;
}

export function GifFavoriteContextMenuItem(props: { gif: ContextMenuGif }) {
   const { favoriteGifs, addFavorite, removeFavorite } = useFavoriteGifs();

   const gif = props.gif;
   const isFavorite = favoriteGifs.some((favoriteGif) => favoriteGif.url === gif.url);

   function handleFavorite() {
      if (isFavorite) return removeFavorite(gif.url);
      return addFavorite({ ...gif, timestamp: Date.now() });
   }

   return (
      <ContextMenu.Item label={isFavorite ? "Remove from GIFs" : "Add to GIFs"} onClick={handleFavorite}>
         <IconMingcuteStarFill />
      </ContextMenu.Item>
   );
}
