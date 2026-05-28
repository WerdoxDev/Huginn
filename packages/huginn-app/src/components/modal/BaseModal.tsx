import { Dialog } from "@base-ui/react";
import { HuginnErrorBoundary } from "@components/HuginnErrorBoundary";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useModals } from "@stores/modalsStore";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import clsx from "clsx";
import { type ReactNode, Suspense, useState } from "react";

import ModalBackground from "./ModalBackground";

export default function BaseModal(props: {
   modal: { isOpen: boolean };
   onClose: () => void;
   children?: ReactNode;
   renderChildren: ReactNode;
   backgroundClassName?: string;
   headless?: boolean;
}) {
   const { updateModals } = useModals();
   const [key, setKey] = useState(0);

   const queryErrorResetBoundary = useQueryErrorResetBoundary();
   const handleError = useErrorHandler({
      cancel: {
         callback() {
            queryErrorResetBoundary.reset();
            setKey((k) => k + 1);
            updateModals({ info: { isOpen: false } });
         },
      },
   });

   function onError(e: unknown) {
      props.onClose();
      handleError(e);
   }

   return (
      <Suspense fallback={null}>
         <HuginnErrorBoundary onError={onError} resetKey={key}>
            <Dialog.Root open={props.modal.isOpen} modal onOpenChange={(open) => !open && props.onClose()}>
               <Dialog.Portal>
                  <ModalBackground className={props.backgroundClassName} />
                  <div className={clsx("fixed inset-0 top-6 z-10")}>
                     <div className={clsx("flex h-full w-full justify-center", !props.headless && "items-end pt-20 lg:items-center lg:py-10")}>
                        {props.renderChildren}
                     </div>
                  </div>
               </Dialog.Portal>
            </Dialog.Root>
         </HuginnErrorBoundary>
      </Suspense>
   );
}
