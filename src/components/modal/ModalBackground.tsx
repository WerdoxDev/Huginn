import { TransitionChild } from "@headlessui/react";
import { useWindow } from "../../contexts/windowContext";

export default function ModalBackground() {
   const appWindow = useWindow();

   return (
      <TransitionChild
         as="div"
         enter="duration-150 ease-out"
         enterFrom="opacity-0"
         enterTo="opacity-100"
         leave="duration-150 ease-in"
         leaveFrom="opacity-100"
         leaveTo="opacity-0"
      >
         <div className={`fixed inset-0 top-6 bg-black/50 ${!appWindow.maximized && "rounded-b-lg"}`} />
      </TransitionChild>
   );
}
