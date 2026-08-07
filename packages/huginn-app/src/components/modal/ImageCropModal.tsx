import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import HuginnLabel from "@components/HuginnLabel";

import "../../cropper.css";
import UserProfilePreview from "@components/profile/UserProfilePreview";
import VoiceElement from "@components/voice/VoiceElement";
import { analytics } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
// import { usePostHog } from "posthog-js/react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import { SuperImageCropper } from "super-image-cropper";

import HuginnDialogPanel from "./HuginnDialogPanel";
import { UserProfileCropPreview } from "./UserProfileModal";

export default function ImageCropModal() {
   const { imageCrop: modal, updateModals } = useModals();
   const [isLoading, setIsLoading] = useState(false);
   const [previewImageData, setPreviewImageData] = useState<string>();
   const [imageSize, setImageSize] = useState<{ src: string; aspectRatio: number }>();
   // const posthog = usePostHog();
   const cropperRef = useRef<ReactCropperElement>(null);
   const previewFrameRef = useRef<number | undefined>(undefined);

   const isBanner = modal.cropType === "banner";
   const isChatBackground = modal.cropType === "chat-background";
   const profilePreview = modal.profilePreview;
   const imageAspectRatio = imageSize?.src === modal.originalImageData ? imageSize.aspectRatio : undefined;

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

            if (modal.mimeType !== "image/gif" || isChatBackground) {
               if (isChatBackground) {
                  data = cropperRef.current.cropper
                     .getCroppedCanvas({
                        maxWidth: 2000,
                        maxHeight: 2000,
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: "high",
                     })
                     .toDataURL("image/webp");
               } else {
                  const canvasSize = isBanner ? { width: 444, height: 128 } : { width: 512, height: 512 };
                  data = cropperRef.current.cropper.getCroppedCanvas(canvasSize).toDataURL();
               }
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
         if (modal.originalImageData?.startsWith("blob:")) URL.revokeObjectURL(modal.originalImageData);
         // posthog.capture("image_crop_modal_closed");
      }
   }, [modal.isOpen, modal.originalImageData]);

   useEffect(() => {
      if (!modal.isOpen || !modal.originalImageData) return;

      let isCancelled = false;
      const image = new Image();

      image.onload = () => {
         if (!isCancelled && image.naturalHeight > 0) {
            setImageSize({ src: modal.originalImageData, aspectRatio: image.naturalWidth / image.naturalHeight });
         }
      };
      image.onerror = () => {
         if (!isCancelled) setImageSize({ src: modal.originalImageData, aspectRatio: 1 });
      };
      image.src = modal.originalImageData;

      return () => {
         isCancelled = true;
      };
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
      <HuginnDialogPanel className={clsx("w-full lg:h-max lg:w-max", profilePreview && "h-full")}>
         <div className="flex h-full w-full flex-col">
            <div
               className={clsx(
                  "scroll-thin scroll-surface-alt flex gap-5 overflow-y-scroll pt-5 pr-2.5 pb-5 pl-5",
                  profilePreview && "flex-col lg:flex-row",
               )}
            >
               <div
                  style={{ "--image-aspect-ratio": imageAspectRatio ?? 1 } as CSSProperties}
                  className={clsx(
                     "flex max-h-[calc(100vh-24rem)] w-full shrink-0 items-center justify-center rounded-lg bg-black/50 lg:aspect-(--image-aspect-ratio) lg:max-h-[100vh-16rem] lg:w-auto lg:max-w-[min(calc(100vw-16rem),576px)] lg:min-w-96",
                  )}
               >
                  {imageAspectRatio !== undefined && (
                     <Cropper
                        ref={cropperRef}
                        src={modal.originalImageData}
                        initialAspectRatio={isChatBackground ? imageAspectRatio : isBanner ? 444 / 128 : 1}
                        className={clsx("h-full w-full", isBanner && "banner-crop", isChatBackground && "background-crop")}
                        aspectRatio={isChatBackground ? Number.NaN : isBanner ? 444 / 128 : 1}
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
                        cropBoxResizable={isChatBackground}
                        cropBoxMovable={isChatBackground}
                        toggleDragModeOnDblclick={false}
                        ready={updatePreview}
                        crop={updatePreview}
                     />
                  )}
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
