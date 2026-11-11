import { useContextMenu } from "@stores/contextMenuStore";

import ContextMenu from "./ContextMenu";

export default function StickerContextMenu() {
   const { data } = useContextMenu("sticker");
   if (!data || data.sticker.source !== "custom") return null;
   return (
      <ContextMenu.Item color="negative" label="Delete Sticker" onClick={data.onDelete}>
         <IconMingcuteDeleteFill />
      </ContextMenu.Item>
   );
}
