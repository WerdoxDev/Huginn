import { MessageContext } from "@contexts/MessageProvider";
import { usePreviewMessageRenderer } from "@hooks/usePreviewMessageRenderer";
import clsx from "clsx";
import { useContext, useMemo, useRef } from "react";
import type { Descendant } from "slate";
import { Slate, Editable } from "slate-react";

export default function EditMessage() {
   const context = useContext(MessageContext);
   const { decorate, editor, renderElement, renderLeaf } = usePreviewMessageRenderer();
   const editableRef = useRef<HTMLDivElement>(null);

   const initialValue = useMemo(
      () => context.message.content.split("\n").map((x) => ({ type: "paragraph", children: [{ text: x }] })) as Descendant[],
      [context],
   );

   return (
      <div className="bg-surface-alt group mt-1.5 flex flex-col items-start gap-y-2 p-2 pl-4">
         <div
            className={clsx(
               "wrap-anywhere bg-surface relative whitespace-break-spaces rounded-md p-0 font-normal text-white ring ring-white/50 group-hover:shadow-sm",
            )}
         >
            <div className="flex items-start font-light text-white">
               <Slate editor={editor} initialValue={initialValue}>
                  <Editable
                     ref={editableRef}
                     className="outline-hidden h-full whitespace-break-spaces px-3 py-3 font-light leading-[24px] text-white caret-white"
                     decorate={decorate}
                     renderLeaf={renderLeaf}
                     renderElement={renderElement}
                     disableDefaultStyles
                  />
               </Slate>
            </div>
         </div>
      </div>
   );
}
