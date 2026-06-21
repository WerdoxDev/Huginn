import { Dialog } from "@base-ui/react";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";

export default function ModalBackground(props: { className?: string }) {
   const huginnWindow = useHuginnWindow();

   return (
      <Dialog.Backdrop
         forceRender
         className={clsx(
            "fixed inset-0 top-6 z-10 bg-black/50 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
            !huginnWindow.maximized && "rounded-b-lg",
            props.className,
         )}
      />
   );
}
