import { DialogBackdrop } from "@headlessui/react";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";

export default function ModalBackground(props: { className?: string }) {
   const huginnWindow = useHuginnWindow();

   return (
      <DialogBackdrop
         transition
         className={clsx(
            "fixed inset-0 top-6 bg-black/50 backdrop-blur-xs transition-all duration-200 data-closed:opacity-0 data-closed:backdrop-blur-none",
            !huginnWindow.maximized && "rounded-b-lg",
            props.className,
         )}
      />
   );
}
