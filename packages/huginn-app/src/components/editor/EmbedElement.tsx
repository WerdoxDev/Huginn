import ImagePreview from "@components/ImagePreview";
import VideoPlayer from "@components/VideoPlayer";
import { constants, constrainImageSize } from "@huginn/shared";
import clsx from "clsx";
import { useContext, useMemo } from "react";
import type { RenderElementProps } from "slate-react";
import type { EmbedElement as SlateEmbedElement } from "@/index";
import { useContextMenu } from "@stores/contextMenuStore";
import { MessageContext } from "@contexts/messageProvider";

export default function EmbedElement(props: RenderElementProps) {
   const { url, description, title, thumbnail, video } = props.element as SlateEmbedElement;
   const { open } = useContextMenu("message");
   const context = useContext(MessageContext);
   const barebone = useMemo(() => description === undefined && title === undefined && (thumbnail || video), [description, title, thumbnail, video]);
   const dimensions = useMemo(
      () =>
         constrainImageSize(
            thumbnail?.width ?? video?.width ?? 0,
            thumbnail?.height ?? video?.height ?? 0,
            constants.EMBED_MEDIA_MAX_WIDTH,
            constants.EMBED_MEDIA_MAX_HEIGHT,
         ),
      [thumbnail, video],
   );

   return (
      <div {...props.attributes} contentEditable={false} style={{ maxWidth: `${constants.EMBED_MEDIA_MAX_WIDTH + 16}px` }}>
         <div className={clsx("mb-1 mt-1 flex max-w-md flex-col items-start", !barebone && "bg-surface-deep rounded-lg p-2")}>
            {title && (
               <span
                  onContextMenu={(e) => open({ message: context.message, url }, e)}
                  className={clsx(url && "text-primary-500 cursor-pointer hover:underline", description ? "mb-1" : "mb-2")}
                  onClick={url ? () => window.electronAPI.openExternal(url) : undefined}
               >
                  {title}
               </span>
            )}
            {description && <span className={clsx("text-sm", thumbnail && "mb-2")}>{description}</span>}
            <div className="relative">
               {thumbnail && (
                  <ImagePreview
                     width={dimensions.width}
                     height={dimensions.height}
                     originalWidth={thumbnail.width ?? 0}
                     originalHeight={thumbnail.height ?? 0}
                     url={thumbnail.url}
                     disableQuery
                  />
               )}
               {video && <VideoPlayer url={video.url} width={dimensions.width} height={dimensions.height} />}
            </div>
         </div>
      </div>
   );
}
