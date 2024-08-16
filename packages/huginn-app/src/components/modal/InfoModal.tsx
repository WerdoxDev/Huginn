import HuginnButton from "@components/button/HuginnButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { Description, Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { useEffect, useMemo } from "react";
import ModalBackground from "./ModalBackground";
import clsx from "clsx";

export default function InfoModal() {
   const { info: modal } = useModals();
   const dispatch = useModalsDispatch();

   const textColor = useMemo(
      () =>
         modal.status === "default"
            ? "text-text/80"
            : modal.status === "error"
              ? "text-error"
              : modal.status === "success"
                ? "text-primary"
                : "",
      [modal],
   );

   const backgroundColor = useMemo(
      () =>
         modal.status === "default"
            ? "bg-warning"
            : modal.status === "error"
              ? "bg-error"
              : modal.status === "success"
                ? "bg-primary"
                : "",
      [modal],
   );

   const borderColor = useMemo(
      () =>
         modal.status === "default"
            ? "border-warning/50"
            : modal.status === "error"
              ? "border-error/50"
              : modal.status === "success"
                ? "border-success/50"
                : "border-primary/50",
      [modal],
   );

   // const title = useMemo(
   //    () =>
   //       modal.status === "default" ? "Information" : modal.status === "error" ? "Error" : modal.status === "success" ? "Success" : "",
   //    [modal.status],
   // );

   const errorCode = useMemo(() => modal.text.match(/\([A-Za-z0-9]+\)/g)?.[0] ?? "", [modal.text]);

   const formattedText = useMemo(() => {
      return modal.text.replace(/\([A-Za-z0-9]+\)/g, "");
   }, [modal.text]);
   return (
      <Dialog
         open={modal.isOpen}
         transition
         className="relative z-10 transition data-[closed]:opacity-0"
         onClose={() => modal.closable && dispatch({ info: { isOpen: false } })}
      >
         <ModalBackground />
         <div className="fixed inset-0 top-6">
            <div className="flex h-full items-center justify-center">
               <TransitionChild>
                  <DialogPanel
                     className={clsx(
                        "bg-background w-full max-w-xs transform overflow-hidden rounded-xl border-2 p-5 transition-[opacity_transform] data-[closed]:scale-95",
                        borderColor,
                     )}
                  >
                     <DialogTitle as="div" className="flex w-full flex-col items-center justify-center gap-y-5">
                        <div className={clsx("rounded-full bg-opacity-20 p-3", backgroundColor)}>
                           <div className={clsx("rounded-full bg-opacity-80 p-3", backgroundColor)}>
                              {modal.status === "error" && <IconMaterialSymbolsErrorOutline className="h-8 w-8 text-white" />}
                              {modal.status === "default" && <IconMaterialSymbolsInfoOutline className="h-8 w-8 text-white" />}
                           </div>
                        </div>
                        <div className="text-lg font-medium text-white">{modal.title}</div>
                     </DialogTitle>
                     <Description className="mt-1 flex items-center justify-center" as="div">
                        <div className={`text-text/90 text-center`}>
                           {formattedText}
                           {errorCode && <span className="text-error text-nowrap italic opacity-90">{errorCode}</span>}
                        </div>
                     </Description>

                     <div className="mt-5 flex items-center justify-end gap-x-2">
                        <HuginnButton
                           className="bg-secondary w-full !rounded-lg py-2.5"
                           onClick={() => {
                              if (!modal.action?.cancel?.callback) dispatch({ info: { isOpen: false } });
                              else modal.action.cancel.callback();
                           }}
                        >
                           {modal.action?.cancel?.text ?? "Close"}
                        </HuginnButton>

                        {modal.action?.confirm && (
                           <HuginnButton
                              className="bg-primary text-text w-full !rounded-lg py-2.5"
                              onClick={() => {
                                 modal.action?.confirm?.callback();
                              }}
                           >
                              {modal.action.confirm.text}
                           </HuginnButton>
                        )}
                     </div>

                     {modal.closable && (
                        <ModalCloseButton
                           onClick={() => {
                              dispatch({ info: { isOpen: false } });
                           }}
                        />
                     )}
                  </DialogPanel>
               </TransitionChild>
            </div>
         </div>
      </Dialog>
   );
}
