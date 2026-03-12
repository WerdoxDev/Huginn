import type { Descendant } from "slate";

import { MessageContext } from "@contexts/MessageProvider";
import { usePreviewMessageRenderer } from "@hooks/usePreviewMessageRenderer";
import clsx from "clsx";
import { useContext, useMemo, useRef } from "react";
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
      <div className="group bg-surface-alt mt-1.5 flex flex-col items-start gap-y-2 p-2 pl-4">
         <div
            className={clsx(
               "bg-surface relative rounded-md p-0 font-normal wrap-anywhere whitespace-break-spaces text-white ring ring-white/50 group-hover:shadow-sm",
            )}
         >
            <div className="flex items-start font-light text-white">
               <Slate editor={editor} initialValue={initialValue}>
                  <Editable
                     ref={editableRef}
                     className="h-full px-3 py-3 leading-[24px] font-light whitespace-break-spaces text-white caret-white outline-hidden"
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
