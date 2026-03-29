import ErrorComponent from "@components/ErrorComponent";
import { Dialog } from "@headlessui/react";
import { useErrorHandler } from "@hooks/useErrorHandler";
import { useModals } from "@stores/modalsStore";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import clsx from "clsx";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

import ModalBackground from "./ModalBackground";

export default function BaseModal(props: {
   modal: { isOpen: boolean };
   onClose: () => void;
   children?: ReactNode;
   renderChildren: ReactNode;
   backgroundClassName?: string;
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
      <Suspense>
         <Dialog open={props.modal.isOpen} transition onClose={props.onClose} className="relative z-30 transition">
            <ModalBackground className={props.backgroundClassName} />
            <div className={clsx("fixed inset-0 top-6 z-10")}>
               <div className="flex h-full w-full items-end justify-center pt-20 lg:items-center lg:py-20">
                  <ErrorBoundary fallback={null} onError={onError}>
                     {props.modal.isOpen && props.renderChildren}
                  </ErrorBoundary>
               </div>
            </div>
         </Dialog>
      </Suspense>
   );
}

function ModalErrorComponent(props: { error: unknown }) {
   const { resetBoundary } = useErrorBoundary();

   // function handleClose() {}
   return (
      <div className="bg-surface rounded-lg p-10">
         <ErrorComponent error={props.error} />
      </div>
   );
}
