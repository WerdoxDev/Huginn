import type { RefObject } from "react";

export default function GhostMessages(props: { ref: RefObject<HTMLDivElement | null> }) {
   return (
      <div className="pointer-events-none shrink-0" ref={props.ref}>
         <div className="bg-surface-deep h-screen w-full"></div>
      </div>
   );
}
