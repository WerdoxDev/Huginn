import type { AttachmentElement as SlateAttachmentElement } from "@/index";
import LoadingIcon from "@components/LoadingIcon";
import Tooltip from "@components/tooltip/Tooltip";
import { useModalsDispatch } from "@contexts/modalContext";
import { constrainImageSize, isImageMediaType } from "@huginn/shared";
import { getSizeText } from "@lib/utils";
import { useHuginnWindow } from "@stores/windowStore";
import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RenderElementProps } from "slate-react";

export default function AttachmentElement(props: RenderElementProps) {
	const { contentType, url, description, size, width, height, filename } = props.element as SlateAttachmentElement;
	const huginnWindow = useHuginnWindow();
	const [loaded, setLoaded] = useState(false);
	const [errored, setErrored] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const dimensions = useMemo(() => constrainImageSize(width ?? 0, height ?? 0, 448, 320, true), [width, height]);
	const dispatch = useModalsDispatch();

	useEffect(() => {
		if (imgRef.current?.complete) {
			setLoaded(true);
		}
	}, []);

	function download() {
		if (huginnWindow.environment === "desktop") {
			open(url);
		} else {
			window.open(url);
		}
	}

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
							src={url}
							alt={filename}
							onClick={() => dispatch({ magnifiedImage: { isOpen: true, url, width, height, filename } })}
							className={clsx("cursor-pointer rounded-md object-contain", errored && "hidden")}
							style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
						/>
						{(!loaded || errored) && (
							<div
								className={clsx(!errored && "absolute inset-0", "flex items-center justify-center rounded-md bg-background/40")}
								style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
							>
								{!loaded && !errored && <LoadingIcon className="size-16" />}
								{errored && <IconMingcuteWarningFill className="size-16 text-error" />}
							</div>
						)}
					</>
				) : (
					<div className="flex w-full items-center gap-x-2 rounded-lg bg-secondary px-2 py-3">
						<IconMingcuteFileFill className="size-10 shrink-0" />
						<div className="flex flex-col justify-center gap-y-0.5">
							<div className="cursor-pointer text-accent text-sm hover:underline" onClick={download}>
								{filename}
							</div>
							<div className="text-white/50 text-xs">{getSizeText(size)}</div>
						</div>
						<Tooltip>
							<Tooltip.Trigger className="ml-auto" onClick={download}>
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
