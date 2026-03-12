import type { ReactNode } from "react";

import HuginnButton from "./HuginnButton";

export default function QuickActionButton(props: { children?: ReactNode; onClick?: () => void }) {
   return (
      <HuginnButton
         className="border-surface text-text w-full rounded-lg border-2 p-2 px-4 transition-shadow hover:shadow-xl lg:w-max"
         onClick={props.onClick}
      >
         {props.children}
      </HuginnButton>
   );
}
