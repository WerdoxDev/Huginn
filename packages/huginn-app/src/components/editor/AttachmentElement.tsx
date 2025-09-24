import ImagePreview from "@components/ImagePreview";
import Tooltip from "@components/tooltip/Tooltip";
import VideoPlayer from "@components/VideoPlayer";
import { useOpen } from "@hooks/useOpen";
import { changeUrlBase, constants, constrainImageSize, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import { getSizeText } from "@lib/utils";
import { useStorage } from "@stores/storageStore";
import clsx from "clsx";
import { useMemo } from "react";

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
      () =>
         constrainImageSize(
            props.width ?? 0,
            props.height ?? 0,
            constants.ATTACHMENT_MEDIA_MAX_WIDTH,
            constants.ATTACHMENT_MEDIA_MAX_HEIGHT,
         ),
      [props.width, props.height],
   );
   const settings = useStorage("settings");
   const basedUrl = useMemo(() => changeUrlBase(props.url, `${settings.cdnHostname}/cdn`), [props.url]);

   return (
      <div contentEditable={false}>
         <div className="relative my-1 flex flex-col items-start">
            {props.description && <span className={clsx("text-sm")}>{props.description}</span>}
            {isImageMediaType(props.contentType) ? (
               <ImagePreview
                  filename={props.filename}
                  width={dimensions.width}
                  height={dimensions.height}
                  originalWidth={props.width ?? 0}
                  originalHeight={props.height ?? 0}
                  url={basedUrl}
               />
            ) : isVideoMediaType(props.contentType) ? (
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
                        {props.filename}
                     </button>
                     <div className="text-xs text-white/50">{getSizeText(props.size)}</div>
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
