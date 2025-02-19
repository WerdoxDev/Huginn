import { useModals } from "@contexts/modalContext";
import { DialogPanel } from "@headlessui/react";
import { useOpen } from "@hooks/useOpen";
import { constrainImageSize } from "@huginn/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import LoadingIcon from "../LoadingIcon";

export default function MagnifiedImageModal() {
	const { magnifiedImage: modal } = useModals();
	const [loaded, setLoaded] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const { openUrl } = useOpen();

	const dimensions = useMemo(() => {
		console.log(window.innerWidth, "W");
		return constrainImageSize(modal.width, modal.height, window.outerWidth - 300, window.outerHeight - 300);
	}, [modal.width, modal.height]);

	useEffect(() => {
		if (imgRef.current?.complete) {
			setLoaded(true);
		}
	}, []);

	return (
		<DialogPanel
			transition
			className="flex select-none flex-col items-center justify-center duration-200 data-[closed]:scale-75 data-[closed]:opacity-0"
		>
			<img
				src={`${modal.url}`}
				ref={imgRef}
				onLoad={() => setLoaded(true)}
				className="rounded-lg"
				alt={modal.filename}
				style={{
					aspectRatio: `${modal.width}/${modal.height}`,
					maxWidth: "calc(100vw - 300px)",
					maxHeight: "calc(100vh - 300px)",
				}}
			/>
			{!loaded && (
				<div
					className="absolute flex items-center justify-center rounded-lg bg-tertiary/80"
					style={{
						width: `${dimensions.width}px`,
						height: `${dimensions.height}px`,
					}}
				>
					<LoadingIcon className="size-16 " />
				</div>
			)}
			<div className="mt-1 cursor-pointer text-text hover:underline" onClick={() => openUrl(modal.url)}>
				Open original
			</div>
		</DialogPanel>
	);
}
