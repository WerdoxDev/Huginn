import HuginnButton from "@components/button/HuginnButton";
import { useEvent } from "@contexts/eventContext";
import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { DialogPanel } from "@headlessui/react";
import { useEffect, useRef } from "react";
import "cropperjs/dist/cropper.css";
import { usePostHog } from "posthog-js/react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import BaseModal from "./BaseModal";

export default function ImageCropModal() {
	const { imageCrop: modal } = useModals();
	const posthog = usePostHog();
	const modalsDispatch = useModalsDispatch();
	const cropperRef = useRef<ReactCropperElement>(null);
	const { dispatchEvent } = useEvent();

	function confirm() {
		if (cropperRef.current) {
			const data = cropperRef.current?.cropper.getCroppedCanvas({ width: 512, height: 512 }).toDataURL();
			dispatchEvent("image_cropper_done", {
				croppedImageData: data,
			});
			modalsDispatch({ imageCrop: { isOpen: false } });
		}
	}

	useEffect(() => {
		if (modal.isOpen) {
			posthog.capture("image_crop_modal_opened");
		} else {
			posthog.capture("image_crop_modal_closed");
		}
	}, [modal.isOpen]);

	return (
		<BaseModal modal={modal} onClose={() => modalsDispatch({ imageCrop: { isOpen: false } })}>
			<DialogPanel className="flex transform flex-col overflow-hidden rounded-xl border-2 border-primary/50 bg-background transition-[opacity_transform] data-[closed]:scale-95">
				<div className="m-5 mb-0 flex h-[30rem] w-[30rem] items-center justify-center rounded-lg bg-black/50">
					<Cropper
						ref={cropperRef}
						src={modal.originalImageData}
						initialAspectRatio={1}
						className="h-[30rem] w-[30rem]"
						aspectRatio={1}
						movable={true}
						unselectable="off"
						zoomable={true}
						viewMode={1}
						dragMode="move"
						guides={false}
						background={false}
						modal={false}
						scalable={false}
						autoCropArea={1}
						cropBoxResizable={false}
						cropBoxMovable={false}
						toggleDragModeOnDblclick={false}
					/>
				</div>
				<div className="mx-5 my-1 text-text/60 italic">NOTE: zoom with scroll wheel</div>
				<div className="flex w-full justify-end gap-x-2 bg-secondary p-5">
					<HuginnButton
						onClick={() => modalsDispatch({ imageCrop: { isOpen: false } })}
						className="w-20 shrink-0 py-2 decoration-white hover:underline"
					>
						Cancel
					</HuginnButton>
					<HuginnButton onClick={confirm} className="w-20 bg-primary py-2 text-text">
						Confirm
					</HuginnButton>
				</div>
			</DialogPanel>
		</BaseModal>
	);
}
