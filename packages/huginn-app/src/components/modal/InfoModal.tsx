import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import { Description, DialogTitle } from "@headlessui/react";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { useEffect, useMemo } from "react";

import HuginnDialogPanel from "./HuginnDialogPanel";
// import { usePostHog } from "posthog-js/react";

export default function InfoModal() {
   const { info: modal, updateModals } = useModals();
   // const posthog = usePostHog();

   const mutationState = useMutationLatestState(modal.action?.confirm?.mutationKey);

   const innerColor = useMemo(
      () =>
         modal.status === "info"
            ? "bg-caution-200!"
            : modal.status === "error"
              ? "bg-negative-200!"
              : modal.status === "success"
                ? "bg-positive-400!"
                : "",
      [modal],
   );

   const backgroundColor = useMemo(
      () =>
         modal.status === "info"
            ? "bg-caution-600!"
            : modal.status === "error"
              ? "bg-negative-600!"
              : modal.status === "success"
                ? "bg-positive-800!"
                : "",
      [modal],
   );

   const borderColor = useMemo(
      () =>
         modal.status === "info"
            ? "border-caution-300!"
            : modal.status === "error"
              ? "border-negative-300!"
              : modal.status === "success"
                ? "border-positive-500!"
                : "border-primary-800!",
      [modal],
   );

   const errorCode = useMemo(() => (typeof modal.text === "string" && modal.text.match(/\([A-Za-z0-9]+\)/g)?.[0]) ?? "", [modal.text]);

   const formattedText = useMemo(() => {
      return typeof modal.text === "string" ? modal.text.replace(/\([A-Za-z0-9]+\)/g, "") : modal.text;
   }, [modal.text]);

   useEffect(() => {
      if (modal.isOpen) {
         // posthog.capture("info_modal_opened", { title: modal.title, text: modal.text, status: modal.status });
      } else {
         // posthog.capture("info_modal_closed");
      }
   }, [modal.isOpen]);

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
            <HuginnButton
               className="h-10 w-full"
               color="surface"
               onClick={() => {
                  if (!modal.action?.cancel?.callback) updateModals({ info: { isOpen: false } });
                  else modal.action.cancel.callback();
               }}
            >
               {modal.action?.cancel?.text ?? "Close"}
            </HuginnButton>

            {modal.action?.confirm && (
               <LoadingButton
                  isLoading={mutationState?.status === "pending"}
                  className="text-text h-10 w-full"
                  color="primary"
                  onClick={() => {
                     modal.action?.confirm?.callback();
                  }}
               >
                  {modal.action.confirm.text}
               </LoadingButton>
            )}
         </DialogActions>
      </HuginnDialogPanel>
   );
}
