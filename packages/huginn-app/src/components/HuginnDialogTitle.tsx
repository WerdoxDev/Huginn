import { Description, DialogTitle } from "@headlessui/react";

export default function HuginnDialogTitle(props: { title: string; description?: string }) {
   return (
      <div className="flex flex-col gap-y-1">
         <DialogTitle className="text-text flex items-center text-xl font-bold">{props.title}</DialogTitle>
         <Description className="text-text/70">{props.description}</Description>
      </div>
   );
}
