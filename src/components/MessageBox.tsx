import { snowflake } from "@shared/snowflake";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { KeyboardEvent, useCallback, useMemo } from "react";
import { Descendant, Editor, Node, Path, Range, Text, createEditor } from "slate";
import { Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";
import { client } from "../lib/api";
import { tokenize } from "../lib/huginn-tokenizer";

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

const initialValue: Descendant[] = [
   {
      type: "paragraph",
      children: [
         {
            text: "",
         },
      ],
   },
];

export default function MessageBox() {
   const editor = useMemo(() => withReact(createEditor()), []);
   const params = useParams({ strict: false });

   const mutation = useMutation({
      async mutationFn(content: string) {
         const channelId = params.channelId as string;
         const nonce = snowflake.generate();
         console.log(nonce);
         await client.channels.createMessage(channelId, { content: content, nonce: nonce });
      },
   });

   const renderLeaf = useCallback((props: RenderLeafProps) => {
      return <Leaf {...props} />;
   }, []);

   const renderElement = useCallback((props: RenderElementProps) => {
      return <DefaultElement {...props} />;
   }, []);

   const decorate = useCallback(([node, path]: [Node, Path]) => {
      const ranges: Range[] = [];

      if (!Text.isText(node)) {
         return ranges;
      }

      const tokens = tokenize(node.text);

      console.log(tokens);
      for (const token of tokens) {
         const markLength = token.mark!.length;
         const end = token.end + 1;
         ranges.push({
            mark: true,
            anchor: { path, offset: token.start },
            focus: { path, offset: token.start + markLength },
         });
         ranges.push({
            mark: true,
            anchor: { path, offset: end - markLength },
            focus: { path, offset: end },
         });
         ranges.push({
            [token.type]: true,
            anchor: { path, offset: token.start + markLength },
            focus: { path, offset: end - markLength },
         });
      }

      return ranges;
   }, []);

   function onKeyDown(event: KeyboardEvent) {
      if (!event.shiftKey && event.code === "Enter") {
         event.preventDefault();
         mutation.mutateAsync(serialize(editor.children));
         editor.delete({
            at: {
               anchor: Editor.start(editor, []),
               focus: Editor.end(editor, []),
            },
         });
      }
   }

   function serialize(nodes: Descendant[]) {
      return nodes.map((n) => Node.string(n)).join("\n");
   }

   return (
      <div className="relative mx-5 flex w-full flex-wrap-reverse py-2">
         <form className="absolute w-full">
            <div className="flex h-full items-start justify-center rounded-3xl bg-tertiary p-2 ring-2 ring-background">
               <div className="mr-2 flex shrink-0 cursor-pointer items-center rounded-full bg-background p-1.5 transition-all hover:bg-white hover:bg-opacity-20 hover:shadow-xl">
                  <IconGravityUiPlus name="gravity-ui:plus" className="h-5 w-5 text-text" />
               </div>
               <div className="w-full flex-grow-0 self-center overflow-hidden py-1">
                  <Slate editor={editor} initialValue={initialValue}>
                     <Editable
                        placeholder="Message @Emam"
                        className="break-words font-light text-white outline-none"
                        renderLeaf={renderLeaf}
                        renderElement={renderElement}
                        decorate={decorate}
                        onKeyDown={onKeyDown}
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
