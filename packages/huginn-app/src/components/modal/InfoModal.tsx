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

   const borderColor = useMemo(
      () =>
         modal.status === "default"
            ? "border-primary/50"
            : modal.status === "error"
              ? "border-error/50"
              : modal.status === "success"
                ? "border-success/50"
                : "border-primary/50",
      [modal],
   );

   const title = useMemo(
      () =>
         modal.status === "default" ? "Information" : modal.status === "error" ? "Error" : modal.status === "success" ? "Success" : "",
      [modal.status],
   );

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
                        "bg-background w-full max-w-md transform overflow-hidden rounded-lg border-2 p-2 transition-[opacity_transform] data-[closed]:scale-95",
                        borderColor,
                     )}
                  >
                     <DialogTitle as="div" className={clsx("mb-5 flex items-center gap-x-2 text-lg font-medium", textColor)}>
                        {modal.status === "error" && <IconMaterialSymbolsErrorOutline className={clsx("h-8 w-8", textColor)} />}
                        {modal.status === "default" && <IconMaterialSymbolsInfoOutline className={clsx("h-8 w-8", textColor)} />}
                        {title}
                     </DialogTitle>
                     {/* <div className="mb-5 h-0.5 w-full bg-secondary" /> */}
                     <Description className="mt-3 flex items-center justify-center gap-x-5 px-5" as="div">
                        <div className={`text-text text-center`}>
                           {formattedText}
                           <span v-if="errorCode" className={`text-error text-nowrap italic opacity-90`}>
                              {errorCode}
                           </span>
                        </div>
                     </Description>

                     <div className="flex items-center justify-end gap-x-2">
                        <HuginnButton
                           className="mt-5 w-28 py-2.5 decoration-white hover:underline"
                           onClick={() => {
                              if (!modal.action?.cancel?.callback) dispatch({ info: { isOpen: false } });
                              else modal.action.cancel.callback();
                           }}
                        >
                           {modal.action?.cancel?.text ?? "Close"}
                        </HuginnButton>

                        {modal.action?.confirm && (
                           <HuginnButton
                              className="bg-primary text-text mt-5 w-28 py-2.5"
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
