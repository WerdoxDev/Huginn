import GifPlayer from "@components/GifPlayer";
import ImagePreview from "@components/ImagePreview";
import VideoPlayer from "@components/VideoPlayer";
import { MessageContext } from "@contexts/MessageProvider";
import { useOpen } from "@hooks/useOpen";
import { CONSTANTS, constrainImageSize } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import clsx from "clsx";
import { useContext, useMemo } from "react";

export default function EmbedElement(props: {
   embedType: "rich" | "video" | "image" | "gifv" | (string & {});
   thumbnail?: { url: string; width?: number; height?: number };
   video?: { url: string; width?: number; height?: number };
   title?: string;
   description?: string;
   url?: string;
}) {
   const { open } = useContextMenu("message");
   const { openUrl } = useOpen();
   const context = useContext(MessageContext);
   const barebone = useMemo(
      () => props.embedType === "gifv" || (props.description === undefined && props.title === undefined && (props.thumbnail || props.video)),
      [props.embedType, props.description, props.title, props.thumbnail, props.video],
   );
   const dimensions = useMemo(
      () =>
         constrainImageSize(
            props.thumbnail?.width ?? props.video?.width ?? 0,
            props.thumbnail?.height ?? props.video?.height ?? 0,
            CONSTANTS.EMBED_MEDIA_MAX_WIDTH,
            CONSTANTS.EMBED_MEDIA_MAX_HEIGHT,
         ),
      [props.thumbnail, props.video],
   );

   return (
      <div contentEditable={false} style={{ maxWidth: barebone ? `${dimensions.width}px` : `${CONSTANTS.EMBED_MEDIA_MAX_WIDTH + 16}px` }}>
         <div className={clsx("mt-1 mb-1 flex flex-col items-start", !barebone && "bg-surface-deep rounded-lg p-2")}>
            {props.title && props.embedType !== "gifv" && (
               <span
                  onContextMenu={(e) => (context.options?.disableContextMenu ? undefined : open({ message: context.message, url: props.url }, e))}
                  className={clsx(props.url && "text-primary-500 cursor-pointer hover:underline", props.description ? "mb-1" : "mb-2")}
                  onClick={props.url ? () => openUrl(props.url!) : undefined}
               >
                  {props.title}
               </span>
            )}
            {props.description && props.embedType !== "gifv" && (
               <span className={clsx("text-sm", props.thumbnail && "mb-2")}>{props.description}</span>
            )}

            {props.embedType === "gifv" && props.video ? (
               <GifPlayer
                  originalWidth={props.video.width ?? 0}
                  originalHeight={props.video.height ?? 0}
                  height={dimensions.height}
                  width={dimensions.width}
                  url={props.video.url ?? ""}
               />
            ) : props.thumbnail ? (
               <ImagePreview
                  width={dimensions.width}
                  height={dimensions.height}
                  originalWidth={props.thumbnail.width ?? 0}
                  originalHeight={props.thumbnail.height ?? 0}
                  url={props.thumbnail.url}
                  disableQuery
               />
            ) : (
               props.video && <VideoPlayer url={props.video.url} width={dimensions.width} height={dimensions.height} />
            )}
         </div>
      </div>
   );
}
