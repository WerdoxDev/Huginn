import type { ReactNode, RefObject } from "react";

export type MessageBoxPreviewBarProps = {
   previewRef: RefObject<HTMLDivElement | null>;
   itemsRef: RefObject<HTMLDivElement | null>;
   open: boolean;
};

export default function MessageBoxPreviewBar(props: MessageBoxPreviewBarProps & { children: ReactNode }) {
   return (
      <div ref={props.previewRef} className="relative h-0">
         <div className="absolute inset-x-0 bottom-0 h-10 overflow-hidden" inert={!props.open} aria-hidden={!props.open}>
            <div
               ref={props.itemsRef}
               className="border-surface flex h-full items-center gap-x-2 border-b pr-2 pl-4 text-sm"
               style={{ transform: "translateY(100%)", opacity: 0 }}
            >
               {props.children}
            </div>
         </div>
      </div>
   );
}
