import type { ReactNode } from "react";

import clsx from "clsx";

export function ScreenshareModalButton(props: { onClick: () => void; selected: boolean; children?: ReactNode }) {
   return (
      <button
         onClick={props.onClick}
         className={clsx("cursor-pointer rounded-xs px-2 py-1", props.selected ? "bg-primary-700 text-text" : "text-text/80 hover:bg-primary-800")}
         type="button"
      >
         {props.children}
      </button>
   );
}
