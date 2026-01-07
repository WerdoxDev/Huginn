import { Dialog } from "@headlessui/react";
import { useHuginnWindow } from "@stores/windowStore";
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
   const huginnWindow = useHuginnWindow();
   return (
      <Suspense>
         <Dialog open={props.modal.isOpen} transition onClose={props.onClose} className="data-closed:opacity-0 relative z-30 transition duration-200">
            <ModalBackground className={props.backgroundClassName} />
            <div className={clsx("fixed inset-0", huginnWindow.environment === "desktop" && "top-6")}>
               <div className="flex h-full w-full items-center justify-center py-10">{props.renderChildren}</div>
            </div>
         </Dialog>
      </Suspense>
   );
}
