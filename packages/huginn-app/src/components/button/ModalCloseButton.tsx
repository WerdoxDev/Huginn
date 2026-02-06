import clsx from "clsx";
import type { ReactNode } from "react";

export default function ModalCloseButton(props: { children?: ReactNode; onClick: () => void; className?: string }) {
   return (
      <button
         className={clsx(
            "bg-surface-alt hover:bg-surface-deep group absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-white/50 transition-colors hover:text-white/80",
            props.className,
         )}
         onClick={props.onClick}
         type="button"
      >
         <IconMingcuteCloseFill className="h-6 w-6" />
         {props.children}
      </button>
   );
}
