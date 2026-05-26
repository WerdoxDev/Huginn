import { Dialog } from "@base-ui/react";
import clsx from "clsx";

export default function HuginnDialogTitle(props: { title: string; description?: string; className?: string }) {
   return (
      <div className={clsx("flex flex-col gap-y-1", props.className)}>
         <Dialog.Title className="text-text flex items-center text-xl font-bold">{props.title}</Dialog.Title>
         <Dialog.Description className="text-text/70">{props.description}</Dialog.Description>
      </div>
   );
}
