import type { APIExpression } from "@huginnjs/shared";

import MediaPickerPanel from "./MediaPickerPanel";
export default function GifPickerPanel(props: { isOpen?: boolean; onGifSelect?: (gif: APIExpression) => void }) {
   return <MediaPickerPanel kind="gifs" isOpen={props.isOpen} onSelect={props.onGifSelect} />;
}
