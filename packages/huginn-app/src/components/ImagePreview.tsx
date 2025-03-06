import { useModalsDispatch } from "@contexts/modalContext";
import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import LoadingIcon from "./LoadingIcon";

export default function ImagePreview(props: {
	url: string;
	width: number;
	height: number;
	originalWidth: number;
	originalHeight: number;
	filename?: string;
	disableQuery?: boolean;
}) {
	const [loaded, setLoaded] = useState(false);
	const [errored, setErrored] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const dispatch = useModalsDispatch();

	useEffect(() => {
		if (imgRef.current?.complete) {
			setLoaded(true);
		}
	}, []);

	return (
		<>
			<img
				onError={() => setErrored(true)}
				loading="lazy"
				onLoad={() => setLoaded(true)}
				ref={imgRef}
				src={`${props.url}${!props.disableQuery ? `?${new URLSearchParams({ format: "webp", width: props.width.toString(), height: props.height.toString() }).toString()}` : ""}`}
				alt={props.filename}
				onClick={() =>
					dispatch({
						magnifiedImage: {
							isOpen: true,
							url: props.url,
							width: props.originalWidth,
							height: props.originalHeight,
							filename: props.filename,
						},
					})
				}
				className={clsx("cursor-pointer overflow-hidden rounded-md object-contain", errored && "hidden")}
				style={{ width: `${props.width}px`, height: `${props.height}px` }}
			/>
			<Transition show={!loaded || errored}>
				<div
					className={clsx(
						!errored && "absolute inset-0",
						"flex items-center justify-center rounded-md bg-background/40 duration-200 data-[closed]:opacity-0",
					)}
					style={{ width: `${props.width}px`, height: `${props.height}px` }}
				>
					{!loaded && !errored && <LoadingIcon className="size-16" />}
					{errored && <IconMingcuteWarningFill className="size-16 text-error" />}
				</div>
			</Transition>
		</>
	);
}
