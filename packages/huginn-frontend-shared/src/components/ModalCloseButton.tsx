import type { ComponentPropsWithRef, MouseEventHandler } from "react";

import clsx from "clsx";

export type ModalCloseButtonProps = Omit<ComponentPropsWithRef<"button">, "onClick"> & {
   iconClassName?: string;
   onClick: MouseEventHandler<HTMLButtonElement>;
};

function CloseIcon({ className }: { className?: string }) {
   return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
         <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
   );
}

export default function ModalCloseButton({ children, className, iconClassName, type = "button", ...props }: ModalCloseButtonProps) {
   return (
      <button
         {...props}
         aria-label={props["aria-label"] ?? "Close modal"}
         className={clsx(
            "group bg-surface hover:bg-surface-alt absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-md text-white/70 transition-colors outline-none hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
            className,
         )}
         type={type}
      >
         <CloseIcon className={clsx("size-4", iconClassName)} />
         {children}
      </button>
   );
}
