import type { ComponentPropsWithRef, ReactNode } from "react";

import { Dialog } from "@base-ui/react";
import clsx from "clsx";

import DialogActions from "./DialogActions";
import DialogBody from "./DialogBody";

export type HuginnDialogProps = {
   children?: ReactNode;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   modal?: boolean;
};

export default function HuginnDialog({ children, modal = true, onOpenChange, open }: HuginnDialogProps) {
   return (
      <Dialog.Root open={open} modal={modal} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
         <Dialog.Portal>{children}</Dialog.Portal>
      </Dialog.Root>
   );
}

function Backdrop({ className, ...props }: Dialog.Backdrop.Props) {
   return (
      <Dialog.Backdrop
         {...props}
         className={clsx("fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0", className)}
      />
   );
}

function Viewport({ children, className, ...props }: ComponentPropsWithRef<"div">) {
   return (
      <div {...props} className={clsx("fixed inset-0 z-40 flex items-end lg:items-center lg:justify-center lg:p-4", className)}>
         {children}
      </div>
   );
}

function Panel({ className, ...props }: Dialog.Popup.Props) {
   return (
      <Dialog.Popup
         {...props}
         className={clsx(
            "border-primary-800 bg-surface-void relative w-full overflow-hidden rounded-t-xl border-t-2 shadow-lg transition-[opacity_blur_transform] duration-200 outline-none data-ending-style:translate-y-1/2 data-ending-style:opacity-0 data-ending-style:blur-sm data-starting-style:translate-y-1/2 data-starting-style:opacity-0 data-starting-style:blur-sm lg:rounded-xl lg:border-2 lg:data-ending-style:translate-y-0 lg:data-ending-style:scale-90 lg:data-starting-style:translate-y-0 lg:data-starting-style:scale-90",
            className,
         )}
      />
   );
}

function Title({ className, ...props }: Dialog.Title.Props) {
   return <Dialog.Title {...props} className={clsx("text-xl font-bold text-white", className)} />;
}

function Description({ className, ...props }: Dialog.Description.Props) {
   return <Dialog.Description {...props} className={clsx("text-text/70 text-sm", className)} />;
}

function Close(props: Dialog.Close.Props) {
   return <Dialog.Close {...props} />;
}

HuginnDialog.Backdrop = Backdrop;
HuginnDialog.Viewport = Viewport;
HuginnDialog.Panel = Panel;
HuginnDialog.Title = Title;
HuginnDialog.Description = Description;
HuginnDialog.Body = DialogBody;
HuginnDialog.Actions = DialogActions;
HuginnDialog.Close = Close;
