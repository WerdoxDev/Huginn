import type { APISticker } from "@huginnjs/shared";

import { constrainImageSize, CDNRoutes } from "@huginnjs/shared";
import { changeCdnUrlBase } from "@lib/instances";
import { useClientStore } from "@stores/clientStore";

export default function StickerElement(props: { sticker: APISticker }) {
   const { urls } = useClientStore();
   const sticker = props.sticker;
   const src =
      sticker.source === "custom"
         ? changeCdnUrlBase(`/cdn/stickers/${sticker.id}.webp`, urls!.cdn)
         : changeCdnUrlBase(CDNRoutes.getExternal(sticker.src), urls!.cdn);
   const size = constrainImageSize(sticker.width, sticker.height, 160, 160);
   return <img contentEditable={false} src={src} alt={sticker.title} width={size.width} height={size.height} className="my-1 object-contain" />;
}
