import type { MediaViewerPreview as Preview } from "@lib/media-viewer-source";

import { useLayoutEffect, useRef } from "react";

/** Keep the clicked frame visible while the viewer decodes the full media. */
export default function MediaViewerPreview(props: { preview: Preview }) {
   const ref = useRef<HTMLDivElement>(null);

   useLayoutEffect(() => {
      const preview = props.preview;
      preview.style.width = "100%";
      preview.style.height = "100%";
      preview.style.objectFit = "contain";
      ref.current?.append(preview);
      return () => preview.remove();
   }, [props.preview]);

   return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg" role="status" aria-label="Loading media">
         <div ref={ref} className="h-full w-full" />
         <div className="bg-surface-alt/40 absolute inset-0 animate-pulse motion-reduce:animate-none" />
      </div>
   );
}
