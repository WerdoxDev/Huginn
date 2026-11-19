import type { APIExpression } from "@huginnjs/shared";

import MediaPickerPanel from "./MediaPickerPanel";
export default function StickerPickerPanel(props: { isOpen?: boolean; onStickerSelect?: (sticker: APIExpression) => void }) {
   return <MediaPickerPanel kind="stickers" isOpen={props.isOpen} onSelect={props.onStickerSelect} />;
}
