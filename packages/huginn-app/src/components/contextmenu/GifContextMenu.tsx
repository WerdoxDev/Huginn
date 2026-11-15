import { useExpressions } from "@hooks/useExpressions";
import { resolveExpression } from "@huginnjs/shared";
import { useContextMenu } from "@stores/contextMenuStore";

import type { ContextMenuExpression } from "@/types";

import ContextMenu from "./ContextMenu";

export default function GifContextMenu() {
   const { data } = useContextMenu("gif");
   if (!data) return;

   return <GifSaveContextMenuItem gif={data} />;
}

export function GifSaveContextMenuItem(props: { gif: ContextMenuExpression }) {
   const { find, remove, add, downloadAndUpload, isPending } = useExpressions("gifs");
   const expression = resolveExpression(props.gif);
   const isSaved = find(props.gif);

   function handleToggle() {
      if (isSaved) return remove(isSaved).catch(() => {});
      return (expression ? add(expression) : downloadAndUpload(props.gif)).catch(() => {});
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
