import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { DialogPanel } from "@headlessui/react";
import { SyntheticEvent, useState } from "react";
import ReactCrop, { centerCrop, Crop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import BaseModal from "./BaseModal";
import HuginnButton from "@components/button/HuginnButton";

export default function ImageCropModal() {
   const { imageCrop: modal } = useModals();
   const dispatch = useModalsDispatch();
   const [crop, setCrop] = useState<Crop>();

   function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

      const crop = centerCrop(makeAspectCrop({ unit: "%", width: 100 }, 1, width, height), width, height);
      if (width > height) {
         e.currentTarget.style.width = "464px";
      } else {
         e.currentTarget.style.height = "464px";
      }

      setCrop(crop);
   }

   return (
      <BaseModal modal={modal} onClose={() => dispatch({ imageCrop: { isOpen: false } })}>
         <DialogPanel className="border-primary/50 bg-background flex transform flex-col gap-y-5 rounded-xl border-2 p-5 transition-[opacity_transform] data-[closed]:scale-95">
            <div className="flex h-[30rem] w-[30rem] items-center justify-center overflow-hidden rounded-lg bg-black/50 p-2">
               <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1} keepSelection className="">
                  <img src={modal.originalImageData} onLoad={onImageLoad} className="!max-h-[30rem] !max-w-[30rem]" />
               </ReactCrop>
            </div>
            <div className="flex w-full justify-end">
               <HuginnButton className="w-20 shrink-0 py-2 decoration-white hover:underline">Cancel</HuginnButton>
               <HuginnButton className="bg-primary text-text w-20 py-2">Confirm</HuginnButton>
            </div>
         </DialogPanel>
      </BaseModal>
   );
}
