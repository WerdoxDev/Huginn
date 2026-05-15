import { Dialog } from "@base-ui/react";
import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import { Description, DialogTitle } from "@headlessui/react";
import { useModals } from "@stores/modalsStore";
import { animate, createScope } from "animejs";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import HuginnDialogPanel from "./HuginnDialogPanel";
// import { usePostHog } from "posthog-js/react";

const innerColorMap: Record<string, string> = {
   info: "bg-caution-200!",
   error: "bg-negative-200!",
   success: "bg-positive-400!",
};

const backgroundColorMap: Record<string, string> = {
   info: "bg-caution-600!",
   error: "bg-negative-600!",
   success: "bg-positive-800!",
};

const borderColorMap: Record<string, string> = {
   info: "border-caution-300!",
   error: "border-negative-300!",
   success: "border-positive-500!",
};

const glowShadowMap: Record<string, string> = {
   info: "0 0 16px 2px color-mix(in srgb, var(--color-caution-300) 15%, transparent), 0 0 40px 6px color-mix(in srgb, var(--color-caution-600) 8%, transparent)",
   error: "0 0 16px 2px color-mix(in srgb, var(--color-negative-300) 15%, transparent), 0 0 40px 6px color-mix(in srgb, var(--color-negative-600) 8%, transparent)",
   success:
      "0 0 16px 2px color-mix(in srgb, var(--color-positive-400) 15%, transparent), 0 0 40px 6px color-mix(in srgb, var(--color-positive-700) 8%, transparent)",
};

export default function InfoModal() {
   const { info: modal, updateModals } = useModals();
   // const posthog = usePostHog();

   const [isLoading, setIsLoading] = useState(false);

   const iconRef = useRef<HTMLDivElement>(null);
   const titleRef = useRef<HTMLDivElement>(null);
   const descRef = useRef<HTMLDivElement>(null);
   const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

   const innerColor = innerColorMap[modal.status] ?? "";
   const backgroundColor = backgroundColorMap[modal.status] ?? "";
   const borderColor = borderColorMap[modal.status] ?? "border-primary-800!";
   const glowShadow = glowShadowMap[modal.status] ?? "";

   const errorCode = modal.errorCode ?? "";
   const isPlainBodyText = typeof modal.text === "string" || typeof modal.text === "number";

   useEffect(() => {
      if (!iconRef.current || !titleRef.current || !descRef.current) return;

      scopeRef.current?.revert();
      scopeRef.current = createScope().add(() => {
         animate(iconRef.current!, {
            opacity: [0, 1],
            scale: [0.8, 1],
            duration: 500,
            ease: "outCubic",
            ...(modal.status === "error" ? { translateX: [0, -5, 5, -3, 3, 0] } : modal.status === "success" ? { rotate: [0, 8, -5, 0] } : {}),
         });

         animate(titleRef.current!, {
            opacity: [0, 1],
            translateY: [5, 0],
            duration: 500,
            ease: "outCubic",
            delay: 80,
         });

         animate(descRef.current!, {
            opacity: [0, 1],
            translateY: [5, 0],
            duration: 500,
            ease: "outCubic",
            delay: 160,
         });
      });

      return () => {
         scopeRef.current?.revert();
      };
   }, [modal.status]);

   function handleCancelClicked() {
      if (!modal.action?.cancel?.callback) updateModals({ info: { isOpen: false } });
      else modal.action.cancel.callback();
   }

   async function handleConfirmClicked() {
      const result = modal.action?.confirm?.callback();
      if (result instanceof Promise) {
         setIsLoading(true);
         try {
            await result;
         } finally {
            setIsLoading(false);
         }
      }
   }

   return (
      <HuginnDialogPanel className={clsx("lg:max-w-sm", borderColor)} style={{ boxShadow: glowShadow }}>
         <DialogBody className="gap-y-0!">
            <Dialog.Title className="flex w-full flex-col items-center justify-center gap-y-3" render={<div></div>}>
               <div ref={iconRef} style={{ opacity: 0 }} className={clsx("rounded-full p-2.5", backgroundColor)}>
                  <div className={clsx("rounded-full p-2.5", innerColor)}>
                     {modal.status === "error" && <IconMingcuteAlertFill className="size-7 text-white" />}
                     {modal.status === "info" && <IconMingcuteInformationFill className="size-7 text-white" />}
                     {modal.status === "success" && <IconMingcuteCheckFill className="size-7 text-white" />}
                  </div>
               </div>

               <div ref={titleRef} style={{ opacity: 0 }} className="text-center text-lg font-semibold text-white">
                  {modal.title}
               </div>
            </Dialog.Title>

            <Dialog.Description
               className="mt-1"
               render={() => (
                  <div ref={descRef} style={{ opacity: 0 }} className="text-text/80 text-center">
                     {isPlainBodyText ? <div>{modal.text}</div> : modal.text}
                     {/* {errorCode && (
                     <div className="bg-negative-700/50 border-negative-400 mt-2 inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-sm font-medium text-white/80">
                        {errorCode}
                     </div>
                  )} */}
                     {errorCode && (
                        <div className="text-text/60 mt-3.5 text-center text-xs">
                           <span className="uppercase">reason:</span>
                           <span className="ml-1 font-semibold uppercase">{errorCode}</span>
                        </div>
                     )}
                  </div>
               )}
            ></Dialog.Description>
         </DialogBody>

         <DialogActions>
            <HuginnButton className="h-10 w-full" color="surface" onClick={handleCancelClicked}>
               {modal.action?.cancel?.text ?? "Close"}
            </HuginnButton>
            {modal.action?.confirm && (
               <LoadingButton isLoading={isLoading} className="text-text h-10 w-full" color="primary" onClick={handleConfirmClicked}>
                  {modal.action.confirm.text}
               </LoadingButton>
            )}
         </DialogActions>
      </HuginnDialogPanel>
   );
}
