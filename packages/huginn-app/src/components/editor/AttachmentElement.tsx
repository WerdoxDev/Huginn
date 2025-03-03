import type { AttachmentElement as SlateAttachmentElement } from "@/index";
import LoadingIcon from "@components/LoadingIcon";
import VideoPlayer from "@components/VideoPlayer";
import Tooltip from "@components/tooltip/Tooltip";
import { useModalsDispatch } from "@contexts/modalContext";
import { useSettings } from "@contexts/settingsContext";
import { Transition } from "@headlessui/react";
import { useOpen } from "@hooks/useOpen";
import { constants, changeUrlBase, constrainImageSize, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import { getSizeText } from "@lib/utils";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RenderElementProps } from "slate-react";

export default function AttachmentElement(props: RenderElementProps) {
	const { contentType, url, description, size, width, height, filename } = props.element as SlateAttachmentElement;
	const { openUrl } = useOpen();
	const [loaded, setLoaded] = useState(false);
	const [errored, setErrored] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const dimensions = useMemo(
		() => constrainImageSize(width ?? 0, height ?? 0, constants.ATTACHMENT_MEDIA_MAX_WIDTH, constants.ATTACHMENT_MEDIA_MAX_HEIGHT),
		[width, height],
	);
	const settings = useSettings();
	const basedUrl = useMemo(() => changeUrlBase(url, `${settings.cdnAddress}/cdn`), [url]);
	const dispatch = useModalsDispatch();

	useEffect(() => {
		if (imgRef.current?.complete) {
			setLoaded(true);
		}
	}, []);

	return (
		<div {...props.attributes} contentEditable={false}>
			<div className="relative mt-1 mb-1 flex flex-col items-start rounded-lg">
				{description && <span className={clsx("text-sm")}>{description}</span>}
				{isImageMediaType(contentType) ? (
					<>
						<img
							onError={() => setErrored(true)}
							loading="lazy"
							onLoad={() => setLoaded(true)}
							ref={imgRef}
							src={`${basedUrl}?${new URLSearchParams({ format: "webp", width: dimensions.width.toString(), height: dimensions.height.toString() }).toString()}`}
							alt={filename}
							onClick={() => dispatch({ magnifiedImage: { isOpen: true, url: basedUrl, width, height, filename } })}
							className={clsx("cursor-pointer rounded-md object-contain", errored && "hidden")}
							style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
						/>
						<Transition show={!loaded || errored}>
							<div
								className={clsx(
									!errored && "absolute inset-0",
									"flex items-center justify-center rounded-md bg-background/40 duration-200 data-[closed]:opacity-0",
								)}
								style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
							>
								{!loaded && !errored && <LoadingIcon className="size-16" />}
								{errored && <IconMingcuteWarningFill className="size-16 text-error" />}
							</div>
						</Transition>
					</>
				) : isVideoMediaType(contentType) ? (
					<VideoPlayer url={basedUrl} width={dimensions.width} height={dimensions.height} />
				) : (
					<div className="flex w-full items-center gap-x-2 rounded-lg bg-secondary px-2 py-3">
						<IconMingcuteFileFill className="size-10 shrink-0" />
						<div className="flex flex-col justify-center gap-y-0.5">
							<div className="cursor-pointer text-accent text-sm hover:underline" onClick={() => openUrl(basedUrl)}>
								{filename}
							</div>
							<div className="text-white/50 text-xs">{getSizeText(size)}</div>
						</div>
						<Tooltip>
							<Tooltip.Trigger className="ml-auto" onClick={() => openUrl(basedUrl)}>
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
