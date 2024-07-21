import { useClient } from "@contexts/apiContext";
import { APIMessageUser, MessageFlags } from "@huginn/shared";
import { forwardRef, useCallback, useMemo } from "react";
import { Descendant, Node, Path, Range, Text, createEditor } from "slate";
import { DefaultElement, Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";
import UserIconWithStatus from "./UserIconWithStatus";
import MessageLeaf from "./editor/MessageLeaf";
import { tokenize } from "@lib/huginn-tokenizer";
import { hasFlag } from "@huginn/shared";

const BaseMessage = forwardRef<HTMLLIElement, { content?: string; author: APIMessageUser; flags?: MessageFlags | null }>(
   function (props, ref) {
      const client = useClient();

      const isSelf = useMemo(() => props.author.id === client.user?.id, [props.author]);
      const editor = useMemo(() => withReact(createEditor()), []);

      const initialValue = useMemo(() => deserialize(props.content ?? ""), []);

      function deserialize(content: string): Descendant[] {
         return content.split("\n").map(line => ({ type: "paragraph", children: [{ text: line }] }));
      }

      const renderLeaf = useCallback((props: RenderLeafProps) => {
         return <MessageLeaf {...props} />;
      }, []);

      const renderElement = useCallback((props: RenderElementProps) => {
         return <DefaultElement {...props} />;
      }, []);

      const decorate = useCallback(([node, path]: [Node, Path]) => {
         const ranges: Range[] = [];

         if (!Text.isText(node)) {
            return ranges;
         }

         const tokens = tokenize(node.text).sort((a, b) => a.start - b.start);
         let skippedCharacters = 0;
         for (const token of tokens) {
            ranges.push({
               [token.type]: true,
               anchor: { path, offset: token.start - skippedCharacters },
               focus: { path, offset: token.end + 1 - skippedCharacters },
               text: token.content,
            });

            skippedCharacters += (token.mark?.length ?? 0) * 2;
         }

         return ranges;
      }, []);

      return (
         <li ref={ref} className="group select-text rounded-lg p-2 hover:bg-secondary">
            <div className={`flex flex-col items-start gap-y-2 ${isSelf ? "ml-0" : "ml-2"}`}>
               <div className="flex items-center gap-x-2 overflow-hidden rounded-xl">
                  <UserIconWithStatus statusSize="0.5rem" size="1.75rem" className="bg-background" />
                  <div className="text-sm text-text">{isSelf ? "You" : props.author.displayName}</div>
                  {props.flags && hasFlag(props.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
                     <IconMdiNotificationsOff className="size-4 text-text" />
                  ) : null}
               </div>
               {/* <div className="flex flex-col items-start gap-y-0.5"> */}
               <div className={`overflow-hidden font-light text-white`}>
                  <Slate editor={editor} initialValue={initialValue}>
                     <Editable
                        // onMouseDown={(e) => e.preventDefault()}
                        // onClick={(e) => e.preventDefault()}
                        readOnly
                        decorate={param => decorate(param)}
                        renderLeaf={renderLeaf}
                        renderElement={renderElement}
                        className={`rounded-bl-md rounded-br-md rounded-tr-md px-2 py-1 font-normal text-white [overflow-wrap:anywhere] ${isSelf ? "bg-primary" : "bg-background"}`}
                        disableDefaultStyles
                        // className=""
                     />
                  </Slate>
                  {/* {props.content} */}
               </div>
            </div>
            {/* </div> */}
         </li>
      );
   },
);

export default BaseMessage;
