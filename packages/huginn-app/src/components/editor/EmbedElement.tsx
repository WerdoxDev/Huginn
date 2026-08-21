import GifPlayer from "@components/GifPlayer";
import ImagePreview from "@components/ImagePreview";
import VideoPlayer from "@components/VideoPlayer";
import { MessageContext } from "@contexts/MessageProvider";
import { useOpen } from "@hooks/useOpen";
import { CDNRoutes, changeUrlBase, CONSTANTS, constrainImageSize } from "@huginnjs/shared";
import { useClientStore } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import clsx from "clsx";
import { useContext, useMemo, type MouseEvent } from "react";

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
   const { hostnames } = useClientStore();

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

   const thumbnailUrl = useMemo(
      () => (props.thumbnail?.url ? changeUrlBase(CDNRoutes.getExternal(props.thumbnail.url), `${hostnames.cdn}/cdn`) : undefined),
      [props.thumbnail, hostnames.cdn],
   );

   const videoUrl = useMemo(
      () => (props.video?.url ? changeUrlBase(CDNRoutes.getExternal(props.video.url), `${hostnames.cdn}/cdn`) : undefined),
      [props.video, hostnames.cdn],
   );

   function handleGifContextMenu(e: MouseEvent<HTMLVideoElement>) {
      e.stopPropagation();
      open(
         {
            message: context.message,
            gif: {
               url: props.url ?? props.video?.url ?? "",
               src: props.video?.url ?? "",
               width: props.video?.width ?? 0,
               height: props.video?.height ?? 0,
            },
         },
         e,
      );
   }

   function handleImageContextMenu(e: MouseEvent<HTMLDivElement>) {
      e.stopPropagation();
      open(
         {
            message: context.message,
            imgElement: e.currentTarget as HTMLImageElement,
            mediaUrl: props.thumbnail?.url ?? "",
         },
         e,
      );
   }

   function handleVideoContextMenu(e: MouseEvent<HTMLVideoElement>) {
      e.stopPropagation();
      open(
         {
            message: context.message,
            videoElement: e.currentTarget,
            mediaUrl: props.video?.url ?? "",
         },
         e,
      );
   }

   function handleContextMenu(e: MouseEvent<HTMLDivElement>) {
      e.stopPropagation();
      open({ message: context.message, url: props.url }, e);
   }

   return (
      <div contentEditable={false} style={{ maxWidth: barebone ? `${dimensions.width}px` : `${CONSTANTS.EMBED_MEDIA_MAX_WIDTH + 16}px` }}>
         <div className={clsx("mt-1 mb-1 flex flex-col items-start", !barebone && "bg-surface-deep rounded-lg p-2")}>
            {props.title && props.embedType !== "gifv" && (
               <span
                  onContextMenu={context.options?.disableContextMenu ? undefined : handleContextMenu}
                  className={clsx(props.url && "text-primary-500 cursor-pointer hover:underline", props.description ? "mb-1" : "mb-2")}
                  onClick={props.url ? () => openUrl(props.url!) : undefined}
               >
                  {props.title}
               </span>
            )}
            {props.description && props.embedType !== "gifv" && (
               <span className={clsx("text-sm", props.thumbnail && "mb-2")}>{props.description}</span>
            )}

            {props.embedType === "gifv" && props.video && videoUrl ? (
               <GifPlayer
                  originalWidth={props.video.width ?? 0}
                  originalHeight={props.video.height ?? 0}
                  height={dimensions.height}
                  width={dimensions.width}
                  src={videoUrl}
                  url={props.url ?? props.video.url}
                  onContextMenu={context.options?.disableContextMenu ? undefined : handleGifContextMenu}
               />
            ) : props.thumbnail && thumbnailUrl ? (
               <ImagePreview
                  width={dimensions.width}
                  height={dimensions.height}
                  originalWidth={props.thumbnail.width ?? 0}
                  originalHeight={props.thumbnail.height ?? 0}
                  url={thumbnailUrl}
                  disableQuery
                  onContextMenu={context.options?.disableContextMenu ? undefined : handleImageContextMenu}
               />
            ) : (
               props.video &&
               videoUrl && (
                  <VideoPlayer
                     url={videoUrl}
                     width={dimensions.width}
                     height={dimensions.height}
                     onContextMenu={context.options?.disableContextMenu ? undefined : handleVideoContextMenu}
                  />
               )
            )}
         </div>
      </div>
   );
}
