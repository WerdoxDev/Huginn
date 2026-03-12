import { getCodeLanguage } from "@lib/markdown-utils";
import hljs from "highlight.js";
import { useState, useMemo } from "react";

export default function CodeElement(props: { code: string; language?: string }) {
   const [isCopied, setIsCopied] = useState(false);

   const highlighted = useMemo(() => hljs.highlight(props.code, { language: getCodeLanguage(props.language ?? "") ?? "md" }), [props.code]);

   async function copyToClipboard() {
      await navigator.clipboard.writeText(props.code.lastIndexOf("\n") === props.code.length - 1 ? props.code.slice(0, -1) : props.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
   }

   return (
      <div contentEditable={false} className="bg-surface-alt font-ubuntu relative my-1 rounded-md">
         {!isCopied ? (
            <IconMingcuteCopy2Fill
               onClick={copyToClipboard}
               className="text-text/30 hover:text-text absolute top-2 right-1.5 size-4 cursor-pointer"
            />
         ) : (
            <IconMingcuteCheckFill className="text-text absolute top-2 right-1.5 size-4 cursor-pointer" />
         )}

         <div
            className="px-2 py-1 pr-10"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{ __html: highlighted.value }}
         />
      </div>
   );
}
