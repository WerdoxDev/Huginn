import { useExpressions } from "@hooks/useExpressions";
import { useContextMenu } from "@stores/contextMenuStore";

import type { ContextMenuExpression } from "@/types";

import ContextMenu from "./ContextMenu";

export default function StickerContextMenu() {
   const { data } = useContextMenu("sticker");
   if (!data) return null;

   return <StickerSaveContextMenuItem sticker={data} />;
}

export function StickerSaveContextMenuItem(props: { sticker: ContextMenuExpression }) {
   const { find, toggle, isPending } = useExpressions("stickers");
   const isSaved = find(props.sticker);

   function handleToggle() {
      return toggle(props.sticker).catch(() => {});
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
