import { useModals } from "@contexts/modalContext";
import { DialogPanel } from "@headlessui/react";
import { constrainImageSize } from "@huginn/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import LoadingIcon from "../LoadingIcon";

export default function MagnifiedImageModal() {
	const { magnifiedImage: modal } = useModals();
	const dimensions = useMemo(() => constrainImageSize(modal.width, modal.height, 1000, 1000), [modal.width, modal.height]);
	const [loaded, setLoaded] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		if (imgRef.current?.complete) {
			setLoaded(true);
		}
	}, []);

	return (
		<DialogPanel transition className="flex select-none items-center justify-center duration-200 data-[closed]:scale-75 data-[closed]:opacity-0">
			{!loaded && (
				<div
					className="absolute flex items-center justify-center rounded-md bg-tertiary"
					style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
				>
					<LoadingIcon className="size-16 " />
				</div>
			)}
			<img
				src={modal.url}
				ref={imgRef}
				onLoad={() => setLoaded(true)}
				className="h-full rounded-lg"
				alt={modal.filename}
				style={{
					aspectRatio: `${dimensions.width}/${dimensions.height}`,
					maxWidth: "calc(100vw - 300px)",
					maxHeight: "calc(100vh - 300px)",
					minWidth: `${dimensions.width}px)`,
					minHeight: `${dimensions.height}px)`,
				}}
			/>
		</DialogPanel>
	);
}
