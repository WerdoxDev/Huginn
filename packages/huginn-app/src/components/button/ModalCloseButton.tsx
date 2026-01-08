import clsx from "clsx";
import type { ReactNode } from "react";

export default function ModalCloseButton(props: { children?: ReactNode; onClick: () => void; className?: string }) {
   return (
      <button
         className={clsx(
            "bg-surface-alt hover:bg-surface-deep absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md",
            props.className,
         )}
         onClick={props.onClick}
         type="button"
      >
         <IconMingcuteCloseFill className="text-negative-100 h-5 w-5" />
         {props.children}
      </button>
   );
}
