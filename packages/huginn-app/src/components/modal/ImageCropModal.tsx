import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";

import "../../cropper.css";
import { analytics } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
// import { usePostHog } from "posthog-js/react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import { SuperImageCropper } from "super-image-cropper";

import HuginnDialogPanel from "./HuginnDialogPanel";

export default function ImageCropModal() {
   const { imageCrop: modal, updateModals } = useModals();
   const [isLoading, setIsLoading] = useState(false);
   // const posthog = usePostHog();
   const cropperRef = useRef<ReactCropperElement>(null);

   const isBanner = modal.cropType === "banner";

   async function confirm() {
      if (cropperRef.current) {
         return analytics.startActiveSpan("app.image_copper_confirm", async (span) => {
            if (!cropperRef.current) return;

            span.setAttributes({ crop_type: modal.cropType, mime_type: modal.mimeType, data_length: modal.originalImageData.length });
            setIsLoading(true);
            let data: string;

            if (modal.mimeType !== "image/gif") {
               const canvasSize = isBanner ? { width: 444, height: 128 } : { width: 512, height: 512 };
               data = cropperRef.current?.cropper.getCroppedCanvas(canvasSize).toDataURL();
            } else {
               const imageCropper = new SuperImageCropper();
               data = (await imageCropper.crop({
                  cropperInstance: cropperRef.current.cropper,
                  outputType: "base64",
                  src: modal.originalImageData,
               })) as string;
            }

            try {
               await modal.callback?.(data);
            } finally {
               setIsLoading(false);
               span.end();
               close();
            }
         });
         // dispatchEvent("image_cropper_done", {
         //    croppedImageData: data,
         // });
      }
   }

   function close() {
      if (modal.originalImageData?.startsWith("blob:")) {
         URL.revokeObjectURL(modal.originalImageData);
      }
      updateModals({ imageCrop: { isOpen: false } });
   }

   useEffect(() => {
      if (modal.isOpen) {
         // posthog.capture("image_crop_modal_opened");
      } else {
         // posthog.capture("image_crop_modal_closed");
      }
   }, [modal.isOpen]);

   return (
      <HuginnDialogPanel className="w-max">
         <div className="text-text/50 px-5 pt-4 pb-1 text-center text-sm italic">Scroll to zoom</div>
         <div
            className={`m-5 mt-1 flex max-h-[calc(100vh-12rem)] items-center justify-center overflow-hidden rounded-lg bg-black/50 ${isBanner ? "max-w-160" : "max-w-120"}`}
         >
            <Cropper
               ref={cropperRef}
               src={modal.originalImageData}
               initialAspectRatio={isBanner ? 444 / 128 : 1}
               className={clsx("h-full max-h-[calc(100vh-12rem)] w-full", isBanner ? "banner-crop max-w-160" : "max-w-120")}
               aspectRatio={isBanner ? 444 / 128 : 1}
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
         <div className="bg-surface-alt flex w-full gap-x-2 p-5">
            <HuginnButton onClick={close} className="h-10 flex-1" color="surface">
               Cancel
            </HuginnButton>
            <LoadingButton onClick={confirm} className="h-10 flex-1" color="primary" isLoading={isLoading}>
               Confirm
            </LoadingButton>
         </div>
      </HuginnDialogPanel>
   );
}
