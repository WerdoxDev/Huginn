import type { APIEmbed } from "@huginnjs/shared";

import ExpressionPlayer from "@components/ExpressionPlayer";
import ImagePreview from "@components/ImagePreview";
import VideoPreview from "@components/VideoPreview";
import { MessageContext } from "@contexts/MessageProvider";
import { useOpen } from "@hooks/useOpen";
import { CDNRoutes, CONSTANTS, ExpressionType, constrainImageSize, resolveCdnUrl } from "@huginnjs/shared";
import { useClientStore } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import clsx from "clsx";
import { useContext, type MouseEvent } from "react";

export default function EmbedElement(props: {
   media?: APIEmbed["media"];
   embedType: APIEmbed["type"];
   thumbnail?: APIEmbed["thumbnail"];
   video?: { url: string; width?: number; height?: number };
   title?: string;
   description?: string;
   url?: string;
}) {
   const { open } = useContextMenu("message");
   const { openUrl } = useOpen();
   const { message, options } = useContext(MessageContext);
   const { urls } = useClientStore();
   const media = props.media;
   const isSticker = props.embedType === "sticker";
   const isGif = props.embedType === "gif";
   const isExpression = isGif || isSticker;
   const barebone = isExpression || (props.description === undefined && props.title === undefined && !!(props.thumbnail || props.video));
   const thumbnail = media ? (media.contentType.startsWith("image/") ? { ...media, url: media.src } : undefined) : props.thumbnail;
   const video = media ? (media.contentType.startsWith("video/") ? { ...media, url: media.src } : undefined) : props.video;
   const width = media?.width ?? thumbnail?.width ?? video?.width ?? 0;
   const height = media?.height ?? thumbnail?.height ?? video?.height ?? 0;
   const maxWidth = isSticker ? CONSTANTS.STICKER_MEDIA_MAX_WIDTH : CONSTANTS.EMBED_MEDIA_MAX_WIDTH;
   const maxHeight = isSticker ? CONSTANTS.STICKER_MEDIA_MAX_HEIGHT : CONSTANTS.EMBED_MEDIA_MAX_HEIGHT;
   const scale = isExpression && width > 0 && height > 0 ? Math.max(1, Math.min(maxWidth / width, maxHeight / height)) : 1;
   const dimensions = constrainImageSize(Math.round(width * scale), Math.round(height * scale), maxWidth, maxHeight);

   function resolveMediaUrl(url: string) {
      return resolveCdnUrl(media?.type === ExpressionType.UPLOADED ? url : CDNRoutes.getExternal(url), urls!.cdn);
   }

   const thumbnailUrl = thumbnail ? resolveMediaUrl(thumbnail.url) : undefined;
   const videoUrl = video ? resolveMediaUrl(video.url) : undefined;
   const isImageGif = !video && (media ? media.contentType === "image/gif" : !!thumbnail && /\.gif(?:[?#]|$)/i.test(thumbnail.url));
   const expression =
      isExpression || isImageGif
         ? (media ?? { url: props.url ?? video?.url ?? thumbnail?.url ?? "", src: video?.url ?? thumbnail?.url ?? "", width, height })
         : undefined;

   function handleMediaContextMenu(event: MouseEvent<HTMLImageElement | HTMLVideoElement>) {
      event.stopPropagation();
      const target = event.currentTarget;
      open(
         {
            message,
            mediaUrl: target instanceof HTMLVideoElement ? videoUrl : thumbnailUrl,
            ...(target instanceof HTMLVideoElement ? { videoElement: target } : { imgElement: target }),
            ...(isSticker ? { sticker: media } : isGif ? { gif: expression } : {}),
         },
         event,
      );
   }

   function handleContextMenu(event: MouseEvent<HTMLSpanElement>) {
      event.stopPropagation();
      open({ message, url: props.url }, event);
   }

   const playerProps = {
      width: dimensions.width,
      height: dimensions.height,
      onContextMenu: options?.disableContextMenu ? undefined : handleMediaContextMenu,
   };
   const expressionProps = {
      ...playerProps,
      originalWidth: width,
      originalHeight: height,
      kind: isSticker ? ("stickers" as const) : ("gifs" as const),
      showSaveButton: !message.isPreview,
      contentType: media?.contentType,
      filename: media?.title,
      origin: "embed" as const,
   };

   return (
      <div contentEditable={false} style={{ maxWidth: barebone ? `${dimensions.width}px` : `${CONSTANTS.EMBED_MEDIA_MAX_WIDTH + 16}px` }}>
         <div className={clsx("my-1 flex flex-col items-start", !barebone && "bg-surface-deep rounded-lg p-2")}>
            {props.title && !isExpression && (
               <span
                  onContextMenu={options?.disableContextMenu ? undefined : handleContextMenu}
                  className={clsx(props.url && "text-primary-500 cursor-pointer hover:underline", props.description ? "mb-1" : "mb-2")}
                  onClick={props.url ? () => openUrl(props.url!) : undefined}
               >
                  {props.title}
               </span>
            )}
            {props.description && !isExpression && <span className={clsx("text-sm", thumbnail && "mb-2")}>{props.description}</span>}

            {expression && videoUrl ? (
               <ExpressionPlayer {...expressionProps} media={expression} src={videoUrl} />
            ) : expression && thumbnailUrl ? (
               <ExpressionPlayer {...expressionProps} isImage media={expression} src={thumbnailUrl} />
            ) : videoUrl ? (
               <VideoPreview {...playerProps} url={videoUrl} poster={thumbnailUrl} originalWidth={width} originalHeight={height} origin="embed" />
            ) : thumbnailUrl ? (
               <ImagePreview {...playerProps} originalWidth={width} originalHeight={height} url={thumbnailUrl} origin="embed" disableQuery />
            ) : null}
         </div>
      </div>
   );
}
