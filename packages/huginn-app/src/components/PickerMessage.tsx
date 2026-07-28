import type { ReactNode } from "react";

import { clsx } from "clsx";

export default function PickerMessage(props: { children?: ReactNode; className?: string; icon?: ReactNode }) {
   return (
      <div className={clsx("text-text/70 flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", props.className)}>
         {props.icon}
         {props.children !== undefined && <div>{props.children}</div>}
      </div>
   );
}
