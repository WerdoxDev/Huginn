import { useMemo } from "react";
import { Description, Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { useModals, useModalsDispatch } from "../../hooks/useModals";
import HuginnButton from "../button/HuginnButton";
import ModalBackground from "./ModalBackground";

export default function InfoModal() {
   const { info: modal } = useModals();
   const dispatch = useModalsDispatch();

   const textColor = useMemo(
      () =>
         modal.status === "default"
            ? "text-text"
            : modal.status === "error"
              ? "text-error"
              : modal.status === "success"
                ? "text-primary"
                : "",
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
      <Transition show={modal.isOpen}>
         <Dialog as="div" className="relative z-10" onClose={() => dispatch({ info: { isOpen: false } })}>
            <ModalBackground />
            <div className="fixed inset-0 top-6">
               <div className="flex h-full items-center justify-center">
                  <TransitionChild
                     enter="duration-150 ease-out"
                     enterFrom="opacity-0 scale-95"
                     enterTo="opacity-100 scale-100"
                     leave="duration-150 ease-in"
                     leaveFrom="opacity-100 scale-100"
                     leaveTo="opacity-0 scale-95"
                  >
                     <DialogPanel className="w-full max-w-md transform rounded-lg bg-background p-5 transition-all">
                        <DialogTitle
                           as="div"
                           className={`mb-2.5 flex items-center justify-center gap-x-2 text-center text-2xl font-medium ${textColor}`}
                        >
                           {modal.status === "error" && <IconLineMdAlert name="line-md:alert" className="h-8 w-8" />}
                           {title}
                        </DialogTitle>
                        <Description className={`text-center ${textColor}`}>
                           {formattedText}
                           <span v-if="errorCode" className="italic opacity-90">
                              {errorCode}
                           </span>
                        </Description>
                        <div className="mt-5 flex justify-center">
                           <HuginnButton
                              className="primary w-full bg-primary py-2.5"
                              onClick={() => dispatch({ info: { isOpen: false } })}
                           >
                              Continue
                           </HuginnButton>
                        </div>
                     </DialogPanel>
                  </TransitionChild>
               </div>
            </div>
         </Dialog>
      </Transition>
   );
}
