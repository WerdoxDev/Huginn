import type { HuginnToken } from "@/types";
import EditorLeaf from "@components/editor/EditorLeaf";
import { markdownMainEditor } from "@lib/markdown-main";
import { markdownSpoiler } from "@lib/markdown-spoiler";
import { markdownUnderline } from "@lib/markdown-underline";
import {
   organizeTokens,
   getCodeLanguage,
   splitHighlightedTokens,
   getHighlightedLineTokens,
   getTokenLength,
   isOpenToken,
   isCloseToken,
   hasMarkup,
   getSlateFormats,
} from "@lib/markdown-utils";
import hljs from "highlight.js";
import markdownit from "markdown-it";
import { useCallback, useMemo } from "react";
import { createEditor, Editor, Element, Node, Path, Range } from "slate";
import { DefaultElement, withReact, type RenderElementProps, type RenderLeafProps } from "slate-react";

let cache: { text: string; decorations: Record<number, Range[]> } | undefined;

export function usePreviewMessageRenderer() {
   const editor = useMemo(() => withReact(createEditor()), []);
   const md = useMemo(() => new markdownit({ linkify: true }).use(markdownSpoiler).use(markdownUnderline).use(markdownMainEditor), []);

   const renderLeaf = useCallback((props: RenderLeafProps) => {
      return <EditorLeaf {...props} />;
   }, []);

   const renderElement = useCallback((props: RenderElementProps) => {
      return <DefaultElement {...props} />;
   }, []);

   function getAllChildren() {
      const children = Array.from(
         Editor.nodes(editor, {
            at: [],
            mode: "highest",
            match: (node, _path) => Element.isElement(node),
         }),
      );

      return children;
   }

   function calculateRanges() {
      const decorations: Record<number, Range[]> = {};
      const children = getAllChildren();

      const text = children.map((x) => Node.string(x[0])).join("\n");

      if (cache?.text === text) {
         return { ...cache.decorations };
      }

      const result = md.parse(text, {});
      const tokens = organizeTokens(result);

      for (const [i, lineTokens] of tokens.entries()) {
         const child = children.find((x) => x[1][0] === i);
         if (!child) {
            continue;
         }

         const ranges: Range[] = [];
         const path = child[1];

         let index = 0;
         const currentOpenedTokens: HuginnToken[] = [];
         let currentLinkHref: string | undefined;

         for (const token of lineTokens) {
            if (token.type === "fence" && token.map) {
               const highlighted = hljs.highlight(token.content, { language: getCodeLanguage(token.info) ?? "md" });
               const parser = new DOMParser();

               const doc = parser.parseFromString(highlighted.value, "text/html");

               let tokens: Array<{ type: string; content: string | null }> = [];

               function parseNode(
                  node: ChildNode,
               ): Array<{ type: string; content: string | null }> | { type: string; content: string | null } {
                  if (node.nodeType === window.Node.ELEMENT_NODE) {
                     const tokenType = (node as HTMLElement)?.className; // e.g., "hljs-keyword", "hljs-string"

                     const onlyHasText = Array.from(node.childNodes).every((child) => child.nodeType === window.Node.TEXT_NODE);

                     if (!onlyHasText) {
                        return Array.from(node.childNodes)
                           .flatMap(parseNode)
                           .map((token: { type: string; content: string | null }) => ({
                              type: token.type,
                              content: token.content,
                           }));
                     }

                     return { type: tokenType, content: node.textContent };
                  }

                  if (node.nodeType === window.Node.TEXT_NODE) {
                     return [{ type: "text", content: node.textContent }];
                  }

                  return [];
               }

               tokens = Array.from(doc.body.childNodes).flatMap((node) => parseNode(node));

               tokens = splitHighlightedTokens(tokens);
               tokens = getHighlightedLineTokens(tokens, i - (token.map[0] + 1));

               let codeIndex = 0;
               for (const token of tokens) {
                  ranges.push({
                     anchor: { path, offset: codeIndex },
                     focus: { path, offset: codeIndex + (token.content?.length ?? 0) },
                     codeToken: token.type,
                  });
                  codeIndex += token.content?.length ?? 0;
               }

               continue;
            }

            const currentTokenEnd = currentLinkHref?.length ?? getTokenLength(token);

            if (isOpenToken(token) || isCloseToken(token)) {
               if (hasMarkup(token.markup)) {
                  ranges.push({
                     mark: true,
                     anchor: { path, offset: index },
                     focus: { path, offset: index + currentTokenEnd },
                  });
               }

               if (isOpenToken(token)) {
                  currentOpenedTokens.push(token);
               } else if (isCloseToken(token)) {
                  currentOpenedTokens.pop();
               }

               if (token.type === "fence_open" && getCodeLanguage(token.info)) {
                  ranges.push({
                     codeLanguage: true,
                     anchor: { path, offset: index + 3 },
                     focus: { path, offset: index + 3 + token.info.length },
                  });
               }
            }

            // Links have an special href which include the actual whole link instead of the normalized one
            if (token.type === "link_open") {
               currentLinkHref = token.attrs?.[0]?.[1];
               index += currentTokenEnd;
               continue;
            }

            const indexOffset = currentOpenedTokens.some((x) => x.type.includes("code")) ? 1 : 0;
            if (token.content) {
               ranges.push({
                  ...getSlateFormats(currentOpenedTokens),
                  anchor: { path, offset: index - indexOffset },
                  focus: { path, offset: index + currentTokenEnd + indexOffset },
               });
               currentLinkHref = undefined;
            }
            index += currentTokenEnd;
         }

         decorations[i] = ranges;
      }

      cache = { text, decorations: decorations };

      return decorations;
   }

   function decorate([_node, path]: [Node, Path]) {
      const ranges = calculateRanges();

      if (path[0] in ranges) {
         return [...ranges[path[0]]];
      }

      return [];
   }

   return { decorate, editor, renderElement, renderLeaf };
}
