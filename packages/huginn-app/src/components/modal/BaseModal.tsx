import { Dialog, TransitionChild } from "@headlessui/react";
import { ReactNode } from "react";
import ModalBackground from "./ModalBackground";

export default function BaseModal(props: { modal: { isOpen: boolean }; onClose: () => void; children?: ReactNode }) {
   return (
      <Dialog
         open={props.modal.isOpen}
         transition
         onClose={props.onClose}
         className="relative z-10 transition data-[closed]:opacity-0"
      >
         <ModalBackground />
         <div className="fixed inset-0 top-6">
            <div className="flex h-full items-center justify-center">
               <TransitionChild>{props.children}</TransitionChild>
            </div>
         </div>
      </Dialog>
   );
}
