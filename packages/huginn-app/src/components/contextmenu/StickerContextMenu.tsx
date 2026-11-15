import { useExpressions } from "@hooks/useExpressions";
import { resolveExpression } from "@huginnjs/shared";
import { useContextMenu } from "@stores/contextMenuStore";

import type { ContextMenuExpression } from "@/types";

import ContextMenu from "./ContextMenu";

export default function StickerContextMenu() {
   const { data } = useContextMenu("sticker");
   if (!data) return null;

   return <StickerSaveContextMenuItem sticker={data} />;
}

export function StickerSaveContextMenuItem(props: { sticker: ContextMenuExpression }) {
   const { find, remove, add, downloadAndUpload, isPending } = useExpressions("stickers");
   const expression = resolveExpression(props.sticker);
   const isSaved = find(props.sticker);

   function handleToggle() {
      if (isSaved) return remove(isSaved).catch(() => {});
      return (expression ? add(expression) : downloadAndUpload(props.sticker)).catch(() => {});
   }

   return (
      <ContextMenu.Item
         label={isSaved ? "Remove from Stickers" : "Add to Stickers"}
         color={isSaved ? "negative" : "default"}
         disabled={isPending}
         onClick={handleToggle}
      >
         <IconMingcuteStarFill className="size-5 shrink-0" />
      </ContextMenu.Item>
   );
}
