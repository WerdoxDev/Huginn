import AudioPlayer from "@components/AudioPlayer";
import ImagePreview from "@components/ImagePreview";
import Tooltip from "@components/tooltip/Tooltip";
import VideoPlayer from "@components/VideoPlayer";
import { MessageContext } from "@contexts/MessageProvider";
import { useOpen } from "@hooks/useOpen";
import { changeUrlBase, CONSTANTS, constrainImageSize, isAudioMediaType, isImageMediaType, isVideoMediaType } from "@huginnjs/shared";
import { getSizeText } from "@lib/utils";
import { useContextMenu } from "@stores/contextMenuStore";
import { useStorage } from "@stores/storageStore";
import clsx from "clsx";
import { useContext, useMemo, type MouseEvent } from "react";

export default function AttachmentElement(props: {
   description?: string;
   url: string;
   width?: number;
   height?: number;
   filename: string;
   size: number;
   contentType: string;
}) {
   const { openUrl } = useOpen();
   const dimensions = useMemo(
      () => constrainImageSize(props.width ?? 0, props.height ?? 0, CONSTANTS.ATTACHMENT_MEDIA_MAX_WIDTH, CONSTANTS.ATTACHMENT_MEDIA_MAX_HEIGHT),
      [props.width, props.height],
   );
   const context = useContext(MessageContext);
   const settings = useStorage("settings");
   const { open } = useContextMenu("message");
   const activePreset = (settings.hostnamePresets ?? []).find((p) => p.name === settings.activePresetName);
   const basedUrl = useMemo(() => changeUrlBase(props.url, `${activePreset?.cdnHostname ?? ""}/cdn`), [props.url, activePreset?.cdnHostname]);

   const isImage = isImageMediaType(props.contentType);
   const isVideo = isVideoMediaType(props.contentType);
   const isAudio = isAudioMediaType(props.contentType);

   function handleImageContextMenu(e: MouseEvent<HTMLDivElement>) {
      e.stopPropagation();
      open(
         {
            message: context.message,
            imgElement: e.currentTarget as HTMLImageElement,
            mediaUrl: basedUrl,
            mediaFilename: props.filename,
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
            mediaUrl: basedUrl,
            mediaFilename: props.filename,
         },
         e,
      );
   }

   return (
      <div
         contentEditable={false}
         style={{
            width: !isImage && !isVideo ? "min(24rem, 100%)" : undefined,
            maxWidth: isImage || isVideo ? `${dimensions.width}px` : undefined,
         }}
      >
         <div className="relative my-1 flex w-full flex-col items-start">
            {props.description && <span className={clsx("text-sm")}>{props.description}</span>}
            {isImage ? (
               <ImagePreview
                  filename={props.filename}
                  width={dimensions.width}
                  height={dimensions.height}
                  originalWidth={props.width ?? 0}
                  originalHeight={props.height ?? 0}
                  contentType={props.contentType}
                  url={basedUrl}
                  onContextMenu={context.options?.disableContextMenu ? undefined : handleImageContextMenu}
               />
            ) : isVideo ? (
               <VideoPlayer
                  url={basedUrl}
                  width={dimensions.width}
                  height={dimensions.height}
                  onContextMenu={context.options?.disableContextMenu ? undefined : handleVideoContextMenu}
               />
            ) : isAudio ? (
               <AudioPlayer url={basedUrl} filename={props.filename} />
            ) : (
               <div className="bg-surface-alt flex w-full max-w-[24rem] items-center gap-x-3 rounded-lg px-3 py-3">
                  <IconMingcuteFileFill className="size-10 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-y-0.5 overflow-hidden rounded-lg">
                     <button
                        type="button"
                        className="text-primary-500 cursor-pointer overflow-hidden text-left text-sm text-nowrap text-ellipsis hover:underline"
                        onClick={() => openUrl(basedUrl)}
                     >
                        {props.filename}
                     </button>
                     <div className="text-xs text-white/50">{getSizeText(props.size)}</div>
                  </div>
                  <Tooltip>
                     <Tooltip.Trigger className="mx-1" onClick={() => openUrl(basedUrl)}>
                        <IconMingcuteDownload2Fill className="size-6 text-white/50 transition-colors duration-100 hover:text-white" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>Download</Tooltip.Content>
                  </Tooltip>
               </div>
            )}
         </div>
      </div>
   );
}
