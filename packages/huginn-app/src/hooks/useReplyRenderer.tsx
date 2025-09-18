import type { AppMessage, HuginnToken } from "@/types";
import { markdownMainMessage } from "@lib/markdown-main";
import { markdownSpoiler } from "@lib/markdown-spoiler";
import { markdownUnderline } from "@lib/markdown-underline";
import { organizeTokens, isElementOpenToken, isElementCloseToken, isOpenToken, isCloseToken, getSlateFormats } from "@lib/markdown-utils";
import { useCallback, useMemo } from "react";
import { Editor, createEditor, type Descendant } from "slate";
import { withReact, type RenderLeafProps, type RenderElementProps } from "slate-react";
import markdownit from "markdown-it";
import MessageLeaf from "@components/editor/MessageLeaf";
import SpoilerElement from "@components/editor/SpoilerElement";
import LinkElement from "@components/editor/LinkElement";
import CodeElement from "@components/editor/CodeElement";
import DefaultElement from "@components/editor/DefaultElement";
import type { CustomElement, ParagraphElement } from "..";
import InlineCodeElement from "@components/editor/InlineCodeElement";

const withHuginn = (editor: Editor) => {
   const { isInline, isVoid } = editor;

   editor.isInline = (element) =>
      element.type === "spoiler" || element.type === "link" || element.type === "code_inline" ? true : isInline(element);
   editor.isVoid = (element) => (element.type === "embed" ? true : isVoid(element));

   return editor;
};

export function useReplyRenderer(message: AppMessage) {
   const editor = useMemo(() => withReact(withHuginn(createEditor())), []);
   const md = useMemo(() => new markdownit({ linkify: true }).use(markdownSpoiler).use(markdownUnderline).use(markdownMainMessage), []);

   const renderLeaf = useCallback(
      (props: RenderLeafProps) => {
         return <MessageLeaf {...props} />;
      },
      [message],
   );

   const renderElement = useCallback((props: RenderElementProps) => {
      if (props.element.type === "spoiler") {
         return <SpoilerElement {...props} />;
      }

      if (props.element.type === "link") {
         return <LinkElement {...props} />;
      }

      if (props.element.type === "code") {
         return <CodeElement {...props} />;
      }

      if (props.element.type === "code_inline") {
         return <InlineCodeElement {...props} />;
      }

      return <DefaultElement {...props} />;
   }, []);

   function getNodeByPath(rootNode: CustomElement, path: number[]) {
      let current = rootNode;

      for (const index of path) {
         if (!Array.isArray(current.children) || current.children[index] === undefined) {
            throw new Error("Invalid path");
         }
         current = current.children[index] as CustomElement; // Navigate to the children
      }

      return current; // Returns the children array at the final path
   }

   const initialValue = useMemo(() => {
      let nodes: Descendant[] = [];

      const content = message.content.replaceAll("\n", " ").replaceAll(/```(?:\S*)?/g, "`");
      const result = md.parse(content, {});
      const tokens = organizeTokens(result);

      let lineNode: ParagraphElement = { type: "paragraph", children: [] };
      const currentPath: number[] = [];
      const currentOpenedTokens: HuginnToken[] = [];

      for (const lineTokens of tokens) {
         if (lineTokens.length === 0) {
            lineNode.children.push({ text: "" });
            nodes.push({ ...lineNode });
            lineNode = { type: "paragraph", children: [] };
            continue;
         }

         for (const token of lineTokens) {
            const deepestNode = !currentPath.length ? lineNode : getNodeByPath(lineNode, currentPath);

            if (isElementOpenToken(token)) {
               if (token.type === "link_open") {
                  deepestNode.children.push({ type: "link", children: [], url: token.attrs?.[0][1] });
               } else if (token.type === "spoiler_open") {
                  deepestNode.children.push({ type: "spoiler", children: [] });
               } else if (token.type === "fence_open") {
                  deepestNode.children.push({ type: "code", children: [{ text: "" }], code: token.content, language: token.info });
               } else if (token.type === "code_open") {
                  deepestNode.children.push({ type: "code_inline", children: [] });
               }
               currentPath.push(deepestNode.children.length - 1);
               continue;
            }

            if (isElementCloseToken(token)) {
               currentPath.pop();
               continue;
            }

            if (isOpenToken(token) || isCloseToken(token)) {
               if (isOpenToken(token)) {
                  currentOpenedTokens.push(token);
               } else if (isCloseToken(token)) {
                  currentOpenedTokens.pop();
               }
               continue;
            }

            if (!token.content) {
               continue;
            }

            // fence token is already finished from its start because the code is passed as a whole
            if (token.type === "fence") {
               continue;
            }

            deepestNode.children.push({
               ...getSlateFormats(currentOpenedTokens),
               text: token.content,
            });
         }

         if (lineNode.children.length) {
            nodes.push({ ...lineNode });
            currentPath.splice(0, currentPath.length);
            lineNode = { type: "paragraph", children: [] };
         }
      }

      // add the last line
      if (lineNode.children.length) {
         nodes.push(lineNode);
      }

      if (message.isPreview) {
         return nodes;
      }

      return nodes;
   }, [message]);

   return { editor, renderElement, renderLeaf, initialValue };
}
