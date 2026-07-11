import { useIsRTL } from "@hooks/useIsRTL";
import { clsx } from "clsx";
import { type ReactNode } from "react";

export default function ParagraphElement(props: { children?: ReactNode; noWrapping?: boolean }) {
   const isRtl = useIsRTL(props.children);

   return (
      <div
         className={clsx(
            "leading-5.5 [text-box-edge:text_text]!",
            props.noWrapping ? "w-full overflow-hidden text-ellipsis whitespace-nowrap" : "w-fit",
            isRtl && "[unicode-bidi:plaintext]",
         )}
      >
         {props.children}
      </div>
   );
}
