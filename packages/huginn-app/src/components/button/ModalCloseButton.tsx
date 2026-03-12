import type { ReactNode } from "react";

import clsx from "clsx";

export default function ModalCloseButton(props: { children?: ReactNode; onClick: () => void; className?: string }) {
   return (
      <button
         className={clsx(
            "group bg-surface hover:bg-surface-alt absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-md text-white/70 transition-colors hover:text-white",
            props.className,
         )}
         onClick={props.onClick}
         type="button"
      >
         <IconMingcuteCloseFill className="size-4" />
         {props.children}
      </button>
   );
}
