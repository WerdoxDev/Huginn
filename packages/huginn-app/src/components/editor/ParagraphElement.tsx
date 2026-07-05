import { clsx } from "clsx";
import { Children, isValidElement, useMemo, type ReactNode } from "react";

const RTL_CHAR_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;

// Recursively extract plain text from a React children tree
function extractText(children: ReactNode) {
   let text = "";
   Children.forEach(children, (child) => {
      if (typeof child === "string" || typeof child === "number") {
         text += child;
      } else if (isValidElement(child) && "children" in (child.props as any)) {
         text += extractText((child.props as any).children);
      }
   });
   return text;
}

export function containsRTL(children: ReactNode): boolean {
   return RTL_CHAR_REGEX.test(extractText(children));
}

export default function ParagraphElement(props: { children?: ReactNode; noWrapping?: boolean }) {
   const isRtl = useMemo(() => containsRTL(props.children), [props.children]);

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
