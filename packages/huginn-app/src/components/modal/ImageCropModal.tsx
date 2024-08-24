import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { DialogPanel } from "@headlessui/react";
import { useRef } from "react";
import HuginnButton from "@components/button/HuginnButton";
import { useEvent } from "@contexts/eventContext";
import "cropperjs/dist/cropper.css";
import Cropper, { ReactCropperElement } from "react-cropper";
import BaseModal from "./BaseModal";

export default function ImageCropModal() {
   const { imageCrop: modal } = useModals();
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

   return (
      <BaseModal modal={modal} onClose={() => modalsDispatch({ imageCrop: { isOpen: false } })}>
         <DialogPanel className="border-primary/50 bg-background flex transform flex-col overflow-hidden rounded-xl border-2 transition-[opacity_transform] data-[closed]:scale-95">
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
               ></Cropper>
            </div>
            <div className="text-text/60 mx-5 my-1 italic">NOTE: zoom with scroll wheel</div>
            <div className="bg-secondary flex w-full justify-end gap-x-2 p-5">
               <HuginnButton className="w-20 shrink-0 py-2 decoration-white hover:underline">Cancel</HuginnButton>
               <HuginnButton onClick={confirm} className="bg-primary text-text w-20 py-2">
                  Confirm
               </HuginnButton>
            </div>
         </DialogPanel>
      </BaseModal>
   );
}
