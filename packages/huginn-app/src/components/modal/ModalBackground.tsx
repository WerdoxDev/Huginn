import { DialogBackdrop } from "@headlessui/react";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";

export default function ModalBackground(props: { className?: string }) {
   const huginnWindow = useHuginnWindow();

   return <DialogBackdrop className={clsx("fixed inset-0 top-6 bg-black/50", !huginnWindow.maximized && "rounded-b-lg", props.className)} />;
}
