import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import { Description, DialogTitle } from "@headlessui/react";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { useState } from "react";

import HuginnDialogPanel from "./HuginnDialogPanel";
// import { usePostHog } from "posthog-js/react";

const innerColorMap: Record<string, string> = {
   info: "bg-caution-200!",
   error: "bg-negative-200!",
   success: "bg-positive-400!",
};

const backgroundColorMap: Record<string, string> = {
   info: "bg-caution-600!",
   error: "bg-negative-600!",
   success: "bg-positive-800!",
};

const borderColorMap: Record<string, string> = {
   info: "border-caution-300!",
   error: "border-negative-300!",
   success: "border-positive-500!",
};

export default function InfoModal() {
   const { info: modal, updateModals } = useModals();
   // const posthog = usePostHog();

   const [isLoading, setIsLoading] = useState(false);

   const innerColor = innerColorMap[modal.status] ?? "";
   const backgroundColor = backgroundColorMap[modal.status] ?? "";
   const borderColor = borderColorMap[modal.status] ?? "border-primary-800!";

   const errorCode = (typeof modal.text === "string" && modal.text.match(/\([A-Za-z0-9]+\)/g)?.[0]) ?? "";
   const formattedText = typeof modal.text === "string" ? modal.text.replace(/\([A-Za-z0-9]+\)/g, "") : modal.text;

   function handleCancelClicked() {
      if (!modal.action?.cancel?.callback) updateModals({ info: { isOpen: false } });
      else modal.action.cancel.callback();
   }

   async function handleConfirmClicked() {
      const result = modal.action?.confirm?.callback();
      if (result instanceof Promise) {
         setIsLoading(true);
         try {
            await result;
         } finally {
            setIsLoading(false);
         }
      }
   }

   return (
      <HuginnDialogPanel className={clsx("lg:max-w-xs", borderColor)}>
         <DialogBody className="gap-y-0!">
            <DialogTitle as="div" className="flex w-full flex-col items-center justify-center gap-y-5">
               <div className={clsx("rounded-full p-3", backgroundColor)}>
                  <div className={clsx("rounded-full p-3", innerColor)}>
                     {modal.status === "error" && <IconMingcuteAlertLine className="h-8 w-8 text-white" />}
                     {modal.status === "info" && <IconMingcuteInformationLine className="h-8 w-8 text-white" />}
                     {modal.status === "success" && <IconMingcuteCheckFill className="h-8 w-8 text-white" />}
                  </div>
               </div>
               <div className="text-center text-lg font-bold text-white">{modal.title}</div>
            </DialogTitle>
            <Description className="mt-1 flex items-center justify-center" as="div">
               <div className="text-text/90 text-center">
                  {formattedText}
                  {errorCode && <span className="text-negative-100 text-nowrap italic opacity-90">{errorCode}</span>}
               </div>
            </Description>
         </DialogBody>
         <DialogActions>
            <HuginnButton className="h-10 w-full" color="surface" onClick={handleCancelClicked}>
               {modal.action?.cancel?.text ?? "Close"}
            </HuginnButton>

            {modal.action?.confirm && (
               <LoadingButton isLoading={isLoading} className="text-text h-10 w-full" color="primary" onClick={handleConfirmClicked}>
                  {modal.action.confirm.text}
               </LoadingButton>
            )}
         </DialogActions>
      </HuginnDialogPanel>
   );
}
