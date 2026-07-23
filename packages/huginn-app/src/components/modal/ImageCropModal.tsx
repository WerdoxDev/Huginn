import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import HuginnLabel from "@components/HuginnLabel";

import "../../cropper.css";
import UserProfilePreview from "@components/profile/UserProfilePreview";
import VoiceElement from "@components/voice/VoiceElement";
import { analytics } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
// import { usePostHog } from "posthog-js/react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import { SuperImageCropper } from "super-image-cropper";

import HuginnDialogPanel from "./HuginnDialogPanel";
import { UserProfileCropPreview } from "./UserProfileModal";

export default function ImageCropModal() {
   const { imageCrop: modal, updateModals } = useModals();
   const [isLoading, setIsLoading] = useState(false);
   const [previewImageData, setPreviewImageData] = useState<string>();
   // const posthog = usePostHog();
   const cropperRef = useRef<ReactCropperElement>(null);
   const previewFrameRef = useRef<number | undefined>(undefined);

   const isBanner = modal.cropType === "banner";
   const profilePreview = modal.profilePreview;

   const updatePreview = useCallback(() => {
      if (!profilePreview || previewFrameRef.current !== undefined) return;

      previewFrameRef.current = requestAnimationFrame(() => {
         previewFrameRef.current = undefined;
         const cropper = cropperRef.current?.cropper;
         if (!cropper) return;

         const canvasSize = isBanner ? { width: 444, height: 128 } : { width: 160, height: 160 };
         setPreviewImageData(cropper.getCroppedCanvas(canvasSize).toDataURL("image/webp", 0.85));
      });
   }, [isBanner, profilePreview]);

   async function confirm() {
      if (cropperRef.current) {
         return analytics.startActiveSpan("app.imageCropperConfirm", async (span) => {
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
      setPreviewImageData(undefined);

      if (modal.isOpen) {
         // posthog.capture("image_crop_modal_opened");
      } else {
         // posthog.capture("image_crop_modal_closed");
      }
   }, [modal.isOpen, modal.originalImageData]);

   useEffect(
      () => () => {
         if (previewFrameRef.current !== undefined) cancelAnimationFrame(previewFrameRef.current);
      },
      [],
   );

   const avatarImageSrc = isBanner ? profilePreview?.avatarImageSrc : (previewImageData ?? profilePreview?.avatarImageSrc);
   const bannerImageSrc = isBanner ? (previewImageData ?? profilePreview?.bannerImageSrc) : profilePreview?.bannerImageSrc;

   return (
      <HuginnDialogPanel className={clsx("h-full w-full lg:h-max lg:w-max")}>
         <div className="flex h-full w-full flex-col">
            <div className="text-text/50 px-5 pt-4 pb-2 text-center text-sm italic">Scroll to zoom</div>
            <div
               className={clsx(
                  "scroll-thin scroll-surface-alt flex gap-5 overflow-y-scroll pr-2.5 pl-5 lg:pb-5",
                  profilePreview && "flex-col lg:flex-row",
               )}
            >
               <div className={clsx("flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/50")}>
                  <Cropper
                     ref={cropperRef}
                     src={modal.originalImageData}
                     initialAspectRatio={isBanner ? 444 / 128 : 1}
                     className={clsx("h-full max-h-[calc(100vh-16rem)] min-h-40 w-full lg:max-w-120 lg:min-w-sm", isBanner && "banner-crop")}
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
                     ready={updatePreview}
                     crop={updatePreview}
                  />
               </div>
               {profilePreview && (
                  <div className="flex flex-col gap-3 lg:w-md">
                     <CropPreview label="Profile">
                        <UserProfileCropPreview userId={profilePreview.userId} avatarImageSrc={avatarImageSrc} bannerImageSrc={bannerImageSrc} />
                     </CropPreview>
                     <CropPreview label="Profile preview">
                        <UserProfilePreview
                           className="w-max"
                           userId={profilePreview.userId}
                           avatarImageSrc={avatarImageSrc}
                           bannerImageSrc={bannerImageSrc}
                           textMaxWidth={144}
                        />
                     </CropPreview>
                     <CropPreview label="Voice tiles">
                        <VoiceElement
                           userId={profilePreview.userId}
                           channelId=""
                           guildId={null}
                           gridElementWidth={288}
                           gridElementHeight={162}
                           type="normal"
                           isConnected={false}
                           isGridView
                           avatarImageSrc={avatarImageSrc}
                           bannerImageSrc={bannerImageSrc}
                        />
                        <VoiceElement
                           userId={profilePreview.userId}
                           channelId=""
                           guildId={null}
                           type="normal"
                           isConnected={false}
                           gridElementHeight={104}
                           gridElementWidth={104}
                           avatarImageSrc={avatarImageSrc}
                           bannerImageSrc={bannerImageSrc}
                        />
                     </CropPreview>
                  </div>
               )}
            </div>
            <DialogActions>
               <HuginnButton onClick={close} className="h-10 flex-1" color="surface">
                  Cancel
               </HuginnButton>
               <LoadingButton onClick={confirm} className="h-10 flex-1" color="primary" isLoading={isLoading}>
                  Confirm
               </LoadingButton>
            </DialogActions>
         </div>
      </HuginnDialogPanel>
   );
}

function CropPreview(props: { label: string; children: React.ReactNode }) {
   return (
      <div className="flex flex-col gap-1">
         <HuginnLabel className="mb-0!">{props.label}</HuginnLabel>
         <div className="flex flex-wrap items-start gap-2">{props.children}</div>
      </div>
   );
}
