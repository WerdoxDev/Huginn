import { Dialog } from "@base-ui/react";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useModals } from "@stores/modalsStore";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import clsx from "clsx";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

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

   const queryErrorResetBoundary = useQueryErrorResetBoundary();
   const handleError = useErrorHandler({
      cancel: {
         callback() {
            queryErrorResetBoundary.reset();
            updateModals({ info: { isOpen: false } });
         },
      },
   });

   function onError(e: unknown) {
      handleError(e);
      props.onClose();
   }

   return (
      <Suspense fallback={null}>
         <Dialog.Root open={props.modal.isOpen} onOpenChange={(open) => !open && props.onClose()}>
            <Dialog.Portal>
               <ModalBackground className={props.backgroundClassName} />
               <div className={clsx("fixed inset-0 top-6 z-10")}> 
                  <div className={clsx("flex h-full w-full justify-center", !props.headless && "items-end pt-20 lg:items-center lg:py-10")}>
                     <ErrorBoundary fallback={null} onError={onError}>
                        {props.renderChildren}
                     </ErrorBoundary>
                  </div>
               </div>
            </Dialog.Portal>
         </Dialog.Root>
      </Suspense>
   );
}
