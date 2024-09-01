import { useWindow } from "@contexts/windowContext";
import { DialogBackdrop } from "@headlessui/react";
import clsx from "clsx";

export default function ModalBackground() {
   const appWindow = useWindow();

   return (
      // <TransitionChild
      //    as="div"
      //    enter="duration-150 ease-out"
      //    enterFrom="opacity-0"
      //    enterTo="opacity-100"
      //    leave="duration-150 ease-in"
      //    leaveFrom="opacity-100"
      //    leaveTo="opacity-0"
      // >
      <DialogBackdrop
         className={clsx(
            "fixed inset-0 bg-black/50",
            !appWindow.maximized && "rounded-b-lg",
            appWindow.environment === "desktop" && "top-6",
         )}
      />
      // </TransitionChild>
   );
}
