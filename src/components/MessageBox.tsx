import Prism, { type Token } from "prismjs";
import "prismjs/components/prism-markdown";
import { KeyboardEvent, useCallback, useState } from "react";
import { Descendant, Node, Path, Range, Text, createEditor } from "slate";
import { Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";

function CodeElement(props: RenderElementProps) {
   return (
      <pre {...props.attributes}>
         <code>{props.children}</code>
      </pre>
   );
}

function DefaultElement(props: RenderElementProps) {
   return <div {...props.attributes}>{props.children}</div>;
}

function Leaf(props: RenderLeafProps) {
   if (props.leaf.bold) {
      return (
         <span className="font-bold" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (props.leaf.italic) {
      return (
         <span className="italic" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (props.leaf.underline) {
      return (
         <span className="underline" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (props.leaf.punctuation) {
      return (
         <span className="text-white/50" {...props.attributes}>
            {props.children}
         </span>
      );
   }
   return <span {...props.attributes}>{props.children}</span>;
}

const initialValue: Descendant[] = [
   {
      type: "paragraph",
      children: [
         {
            text: "Slate is flexible enough to add **decorations** that can format text based on its content. For example, this editor has **Markdown** preview decorations on it, to make it _dead_ simple to make an editor with built-in Markdown previewing.",
         },
      ],
   },
   {
      type: "paragraph",
      children: [{ text: "## Try it out!" }],
   },
   {
      type: "paragraph",
      children: [{ text: "Try it out for yourself!" }],
   },
];

export default function MessageBox() {
   const [editor] = useState(() => withReact(createEditor()));

   const renderLeaf = useCallback((props: RenderLeafProps) => {
      return <Leaf {...props} />;
   }, []);

   function onKeyDown(event: KeyboardEvent) {}

   const decorate = useCallback(([node, path]: [Node, Path]) => {
      const ranges: Range[] = [];

      if (!Text.isText(node)) {
         return ranges;
      }

      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      function getLength(token: string | Token): number {
         if (typeof token === "string") {
            return token.length;
         } else if (typeof token.content === "string") {
            return token.content.length;
         } else if (Array.isArray(token.content)) {
            return token.content.reduce((l, t) => l + getLength(t), 0);
         }

         return 0;
      }

      function getPunctuationLength(type: string) {
         if (type === "bold") return 2;
         else if (type === "italic") return 1;
         else if (type === "underline") return 2;
         return 0;
      }

      function isFormatSupported(type: string) {
         return type === "bold" || type === "italic" || type === "underline";
      }

      const tokens = Prism.tokenize(node.text, Prism.languages.markdown);
      let start = 0;

      for (const token of tokens) {
         const length = getLength(token);
         const end = start + length;

         if (typeof token !== "string" && isFormatSupported(token.type)) {
            const punctuationLength = getPunctuationLength(token.type);
            ranges.push({
               punctuation: true,
               anchor: { path, offset: start },
               focus: { path, offset: start + punctuationLength },
            });
            ranges.push({
               punctuation: true,
               anchor: { path, offset: end - punctuationLength },
               focus: { path, offset: end },
            });
            ranges.push({
               [token.type]: true,
               anchor: { path, offset: start + punctuationLength },
               focus: { path, offset: end - punctuationLength },
            });
         }

         start = end;
      }

      console.log(ranges);

      return ranges;
   }, []);

   return (
      <div className="relative mx-5 flex w-full flex-wrap-reverse py-2">
         <form className="absolute w-full">
            <div className="flex h-full items-start justify-center rounded-3xl bg-tertiary p-2 ring-2 ring-background">
               <div className="mr-2 flex shrink-0 cursor-pointer items-center rounded-full bg-background p-1.5 transition-all hover:bg-white hover:bg-opacity-20 hover:shadow-xl">
                  <IconGravityUiPlus name="gravity-ui:plus" className="h-5 w-5 text-text" />
               </div>
               <div className="w-full grow-0 self-center py-1">
                  <Slate editor={editor} initialValue={initialValue}>
                     <Editable
                        className="font-light text-white outline-none"
                        onKeyDown={onKeyDown}
                        renderLeaf={renderLeaf}
                        decorate={decorate}
                     />
                  </Slate>
               </div>
               <div className="ml-2 flex gap-x-2">
                  <div className="h-8 w-8 rounded-full bg-background" />
                  <div className="h-8 w-8 rounded-full bg-background" />
                  <div className="h-8 w-8 rounded-full bg-background" />
               </div>
            </div>
         </form>
      </div>
   );
}
