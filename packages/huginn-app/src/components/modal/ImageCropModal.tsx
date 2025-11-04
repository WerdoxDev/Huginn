import HuginnButton from "@components/button/HuginnButton";
import { DialogPanel } from "@headlessui/react";
import { dispatchEvent } from "@lib/event-handler";
import { useModals } from "@stores/modalsStore";
import "../../cropper.css";
import { useEffect, useRef } from "react";
// import { usePostHog } from "posthog-js/react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import { SuperImageCropper } from "super-image-cropper";

export default function ImageCropModal() {
   const { imageCrop: modal, updateModals } = useModals();
   // const posthog = usePostHog();
   const cropperRef = useRef<ReactCropperElement>(null);

   async function confirm() {
      if (cropperRef.current) {
         let data: string;

         if (modal.mimeType !== "image/gif") {
            data = cropperRef.current?.cropper.getCroppedCanvas({ width: 512, height: 512 }).toDataURL();
         } else {
            const imageCropper = new SuperImageCropper();
            data = (await imageCropper.crop({
               cropperInstance: cropperRef.current.cropper,
               outputType: "base64",
               src: modal.originalImageData,
            })) as string;
         }

         dispatchEvent("image_cropper_done", {
            croppedImageData: data,
         });
         updateModals({ imageCrop: { isOpen: false } });
      }
   }

   useEffect(() => {
      if (modal.isOpen) {
         // posthog.capture("image_crop_modal_opened");
      } else {
         // posthog.capture("image_crop_modal_closed");
      }
   }, [modal.isOpen]);

   return (
      <DialogPanel
         transition
         className="border-primary-800 bg-surface data-closed:scale-90 flex transform flex-col overflow-hidden rounded-xl border-2 transition-[opacity_transform] duration-200"
      >
         <div className="h-120 w-120 m-5 mb-0 flex items-center justify-center rounded-lg bg-black/50">
            <Cropper
               ref={cropperRef}
               src={modal.originalImageData}
               initialAspectRatio={1}
               className="h-120 w-120"
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
         <div className="text-text/60 mx-5 my-1 italic">NOTE: zoom with scroll wheel</div>
         <div className="bg-surface-alt flex w-full justify-end gap-x-2 p-5">
            <HuginnButton
               onClick={() => updateModals({ imageCrop: { isOpen: false } })}
               className="h-10 w-20 shrink-0 decoration-white hover:underline"
            >
               Cancel
            </HuginnButton>
            <HuginnButton onClick={confirm} className="text-text h-10 w-36" color="primary">
               Confirm
            </HuginnButton>
         </div>
      </DialogPanel>
   );
}
