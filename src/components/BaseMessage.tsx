import { APIMessageUser } from "@shared/api-types";
import { useCallback, useMemo } from "react";
import { Descendant, Node, Path, Range, Text, createEditor } from "slate";
import { Editable, RenderLeafProps, Slate, withReact } from "slate-react";
import { client } from "../lib/api";
import { tokenize } from "../lib/huginn-tokenizer";
import UserIconWithStatus from "./UserIconWithStatus";

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

   if (props.leaf.spoiler) {
      return (
         <span className="rounded-sm bg-white/20 px-0.5" {...props.attributes}>
            {props.children}
         </span>
      );
   }

   if (props.leaf.mark) {
      return (
         <span className="text-white/50" {...props.attributes}>
            {props.children}
         </span>
      );
   }
   return <span {...props.attributes}>{props.children}</span>;
}

export default function BaseMessage(props: { content?: string; author: APIMessageUser }) {
   const isSelf = useMemo(() => props.author.id === client.user?.id, [props.author]);
   const editor = useMemo(() => withReact(createEditor()), []);

   const initialValue = useMemo(() => deserialize(props.content ?? ""), []);

   function deserialize(content: string): Descendant[] {
      return content.split("\n").map((line) => ({ type: "paragraph", children: [{ text: line }] }));
   }

   const renderLeaf = useCallback((props: RenderLeafProps) => {
      return <Leaf {...props} />;
   }, []);

   const decorate = useCallback(([node, path]: [Node, Path]) => {
      const ranges: Range[] = [];

      if (!Text.isText(node)) {
         return ranges;
      }

      const tokens = tokenize(node.text);

      tokens.sort((a, b) => a.start - b.start);
      // console.log(tokens);
      let skippedCharacters = 0;
      for (const token of tokens) {
         // const symbolLength = token.symbol?.length ?? 0;
         // ranges.push({
         //    symbol: true,
         //    anchor: { path, offset: token.start },
         //    focus: { path, offset: token.start + symbolLength },
         // });
         // ranges.push({
         //    symbol: true,
         //    anchor: { path, offset: token.end - symbolLength },
         //    focus: { path, offset: token.end },
         // });

         // console.log(`${token.content} ${token.start} ${token.end}`);
         // *italic*
         // console.log(token.fullText);
         ranges.push({
            [token.type]: true,
            anchor: { path, offset: token.start - skippedCharacters },
            focus: { path, offset: token.end + 1 - skippedCharacters },
            text: token.content,
         });

         skippedCharacters += token.mark!.length * 2;
      }

      return ranges;
   }, []);

   return (
      <li className="group select-text rounded-lg p-2 hover:bg-secondary">
         <div className={`flex flex-col gap-y-2 ${!isSelf && "ml-2"}`}>
            <div className="flex w-full items-center rounded-xl">
               <UserIconWithStatus status-size="0.5rem" size="1.75rem" className="mr-2 bg-background" />
               <div className="text-sm text-text">{isSelf ? "You" : props.author.displayName}</div>
            </div>
            <div className="flex flex-col items-start gap-y-0.5">
               <div
                  className={`min-w-0 rounded-bl-md rounded-br-md rounded-tr-md px-2 py-1 font-light text-white ${isSelf ? "bg-primary/50" : "bg-background"}`}
               >
                  <Slate editor={editor} initialValue={initialValue}>
                     <Editable readOnly decorate={decorate} renderLeaf={renderLeaf} />
                  </Slate>
               </div>
            </div>
         </div>
      </li>
   );
}
