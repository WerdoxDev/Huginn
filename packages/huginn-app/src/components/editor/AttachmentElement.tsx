import ImagePreview from "@components/ImagePreview";
import Tooltip from "@components/tooltip/Tooltip";
import VideoPlayer from "@components/VideoPlayer";
import { useOpen } from "@hooks/useOpen";
import { changeUrlBase, constants, constrainImageSize, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import { getSizeText } from "@lib/utils";
import { useFilesStore } from "@stores/filesStore";
import clsx from "clsx";
import { useMemo } from "react";
import type { RenderElementProps } from "slate-react";
import type { AttachmentElement as SlateAttachmentElement } from "@/index";

export default function AttachmentElement(props: RenderElementProps) {
   const { contentType, url, description, size, width, height, filename } = props.element as SlateAttachmentElement;
   const { openUrl } = useOpen();
   const dimensions = useMemo(
      () => constrainImageSize(width ?? 0, height ?? 0, constants.ATTACHMENT_MEDIA_MAX_WIDTH, constants.ATTACHMENT_MEDIA_MAX_HEIGHT),
      [width, height],
   );
   const { settings } = useFilesStore();
   const basedUrl = useMemo(() => changeUrlBase(url, `${settings.cdnHostname}/cdn`), [url]);

   return (
      <div {...props.attributes} contentEditable={false}>
         <div className="relative my-1 flex flex-col items-start">
            {description && <span className={clsx("text-sm")}>{description}</span>}
            {isImageMediaType(contentType) ? (
               <ImagePreview
                  filename={filename}
                  width={dimensions.width}
                  height={dimensions.height}
                  originalWidth={width ?? 0}
                  originalHeight={height ?? 0}
                  url={basedUrl}
               />
            ) : isVideoMediaType(contentType) ? (
               <VideoPlayer url={basedUrl} width={dimensions.width} height={dimensions.height} />
            ) : (
               <div className="bg-surface-alt flex w-[24rem] items-center gap-x-2 rounded-lg px-2 py-3">
                  <IconMingcuteFileFill className="size-10 shrink-0" />
                  <div className="flex w-full flex-col justify-center gap-y-0.5 overflow-hidden rounded-lg px-2.5">
                     <button
                        type="button"
                        className="text-primary-500 cursor-pointer overflow-hidden text-ellipsis text-nowrap text-left text-sm hover:underline"
                        onClick={() => openUrl(basedUrl)}
                     >
                        {filename}
                     </button>
                     <div className="text-xs text-white/50">{getSizeText(size)}</div>
                  </div>
                  <Tooltip>
                     <Tooltip.Trigger className="mx-2" onClick={() => openUrl(basedUrl)}>
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
