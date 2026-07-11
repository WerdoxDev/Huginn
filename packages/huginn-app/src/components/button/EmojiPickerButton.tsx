import type { MouseEvent, ReactNode } from "react";

import HuginnButton from "./HuginnButton";

export default function ExpressionButton(props: { onClick?: (e: MouseEvent<HTMLButtonElement>) => void; isActive?: boolean; children?: ReactNode }) {
   return (
      <HuginnButton
         onClick={props.onClick}
         color={props.isActive ? "primary" : "surface"}
         className="flex size-10 cursor-pointer items-center justify-center rounded-full! p-2"
      >
         {props.children}
      </HuginnButton>
   );
}
