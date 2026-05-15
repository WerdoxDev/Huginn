import { Dialog } from "@base-ui/react";

export default function HuginnDialogTitle(props: { title: string; description?: string }) {
   return (
      <div className="flex flex-col gap-y-1">
         <Dialog.Title className="text-text flex items-center text-xl font-bold">{props.title}</Dialog.Title>
         <Dialog.Description className="text-text/70">{props.description}</Dialog.Description>
      </div>
   );
}
