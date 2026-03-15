import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import { type ReactNode, Suspense } from "react";

import ModalBackground from "./ModalBackground";

export default function BaseModal(props: {
   modal: { isOpen: boolean };
   onClose: () => void;
   children?: ReactNode;
   renderChildren: ReactNode;
   backgroundClassName?: string;
}) {
   return (
      <Suspense>
         <Dialog open={props.modal.isOpen} transition onClose={props.onClose} className="relative isolate z-30 transition">
            <div className={clsx("fixed inset-0 top-6 z-10")}>
               <div className="flex h-full w-full items-end justify-center lg:items-center lg:py-20">{props.renderChildren}</div>
            </div>
            <ModalBackground className={props.backgroundClassName} />
         </Dialog>
      </Suspense>
   );
}
