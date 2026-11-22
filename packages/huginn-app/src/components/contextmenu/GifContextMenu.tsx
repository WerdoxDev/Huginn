import { useExpressions } from "@hooks/useExpressions";
import { useContextMenu } from "@stores/contextMenuStore";

import type { ContextMenuExpression } from "@/types";

import ContextMenu from "./ContextMenu";

export default function GifContextMenu() {
   const { data } = useContextMenu("gif");
   if (!data) return;

   return <GifSaveContextMenuItem gif={data} />;
}

export function GifSaveContextMenuItem(props: { gif: ContextMenuExpression }) {
   const { find, toggle, isPending } = useExpressions("gifs");
   const isSaved = find(props.gif);

   function handleToggle() {
      return toggle(props.gif).catch(() => {});
   }

   return (
      <ContextMenu.Item
         label={isSaved ? "Remove from GIFs" : "Add to GIFs"}
         color={isSaved ? "negative" : "default"}
         disabled={isPending}
         onClick={handleToggle}
      >
         <IconMingcuteStarFill className="size-5 shrink-0" />
      </ContextMenu.Item>
   );
}
