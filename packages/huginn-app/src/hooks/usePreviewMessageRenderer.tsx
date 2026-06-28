import EditorLeaf from "@components/editor/EditorLeaf";
import PreviewEmojiElement from "@components/editor/PreviewEmojiElement";
import { marked } from "@lib/marked";
import { organizeMarkedTokens } from "@lib/marked-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { Point, type Descendant } from "slate";
import { createEditor, Editor, Element, Node, Path, Range, Text } from "slate";
import { DefaultElement, withReact, type RenderElementProps, type RenderLeafProps } from "slate-react";

import type { EmojiElement } from "..";

function serializeFragments(nodes: Descendant[]): string {
   let text = "";
   for (const node of nodes) {
      if (Text.isText(node)) {
         text += node.text;
         continue;
      }

      const children = serializeFragments(node.children);

      if (Element.isElement(node) && node.type === "emoji") {
         text += node.unicode ?? node.slug;
         continue;
      }

      if (Element.isElement(node) && node.type === "paragraph") {
         text += children + "\n";
         continue;
      }
   }

   return text;
}

function withHuginn(editor: Editor) {
   const { isInline, isVoid, setFragmentData } = editor;

   editor.isInline = (element) => {
      return element.type === "emoji" || isInline(element);
   };

   editor.isVoid = (element) => {
      return element.type === "emoji" || isVoid(element);
   };

   editor.setFragmentData = (data) => {
      setFragmentData(data);

      const { selection } = editor;
      if (!selection) return;
      const fragment = Node.fragment(editor, selection);

      const text = serializeFragments(fragment).trim();

      data.setData("text/plain", text);
   };

   return editor;
}

export function usePreviewMessageRenderer() {
   const editor = useMemo(() => withHuginn(withReact(createEditor())), []);
   const cachedDecorations = useRef<Map<number, Range[]>>(new Map());
   const [decorateVersion, setDecorateVersion] = useState(0);

   const renderLeaf = useCallback((props: RenderLeafProps) => {
      return <EditorLeaf {...props} />;
   }, []);

   const renderElement = useCallback((props: RenderElementProps) => {
      switch (props.element.type) {
         case "emoji":
            return <PreviewEmojiElement {...props} />;
         default:
            return <DefaultElement {...props} />;
      }
   }, []);

   const serialize = useCallback(
      (nodes: Descendant[]) => {
         let text = "";
         for (const node of nodes) {
            if (Text.isText(node)) {
               text += node.text;
               continue;
            }

            const children = serialize(node.children);

            if (Element.isElement(node) && node.type === "emoji") {
               text += " ";
               continue;
            }

            if (Element.isElement(node) && node.type === "paragraph") {
               text += children + "\n";
               continue;
            }
         }

         return text;
      },
      [editor],
   );

   function lineOffsetToPoint(editor: Editor, lineIndex: number, charOffset: number, startIndex: number = 0): Point {
      const lineNode = editor.children[lineIndex] as Element;

      let remaining = charOffset;

      for (let i = startIndex; i < lineNode.children.length; i++) {
         const child = lineNode.children[i];
         const childPath = [lineIndex, i];

         // void elements have " " as text so they don't disrupt tokens when alone
         if (Editor.isVoid(editor, child as Element)) {
            remaining -= 1;
            continue;
         }

         const textLen = Node.string(child).length;

         if (remaining <= textLen) {
            return { path: childPath, offset: remaining };
         }

         remaining -= textLen;
      }

      // Fallback: clamp to end of last text node
      const lastIndex = lineNode.children.length - 1;
      const lastChild = lineNode.children[lastIndex];
      return {
         path: [lineIndex, lastIndex],
         offset: Node.string(lastChild).length,
      };
   }

   function calculateAllDecorations(editor: Editor): Map<number, Range[]> {
      const result = new Map<number, Range[]>();
      const text = serialize(editor.children);

      const tokens = marked.lexer(text);
      const organizedTokens = organizeMarkedTokens(tokens);

      for (const [, path] of Node.children(editor, [])) {
         const lineIndex = path[0];
         const filteredTokens = organizedTokens.filter((t) => t.line === lineIndex);
         const toPoint = (offset: number) => lineOffsetToPoint(editor, lineIndex, offset);

         const decorations: Range[] = [];
         let currentTokens: Array<{ start: number; end: number; type: string }> = [];

         for (const token of filteredTokens) {
            currentTokens = currentTokens.filter((t) => t.end > token.start);

            if (token.type !== "text") {
               currentTokens.push({ start: token.start, end: token.end, type: token.type });

               if (token.mark && token.type !== "link") {
                  decorations.push({
                     anchor: toPoint(token.start),
                     focus: toPoint(token.start + token.mark.length),
                     mark: true,
                  });

                  if (token.type !== "code-fence-open" && token.type !== "code-fence-close" && token.type !== "list-item") {
                     decorations.push({
                        anchor: toPoint(token.end - token.mark.length),
                        focus: toPoint(token.end),
                        mark: true,
                     });
                  }

                  if (token.type === "code-fence-open" && token.code?.lang) {
                     decorations.push({
                        anchor: toPoint(token.start + token.mark.length),
                        focus: toPoint(token.start + token.mark.length + token.code.lang.length),
                        codeLanguage: true,
                     });
                  }
               }

               if (token.type === "code-line" && token.code?.tokens) {
                  decorations.push(
                     ...token.code.tokens.map(
                        (x) =>
                           ({
                              anchor: toPoint(token.start + x.start),
                              focus: toPoint(token.start + x.end),
                              codeToken: x.types.length === 0 ? true : x.types.join(" "),
                           }) as Range,
                     ),
                  );
               }

               if (token.type === "link" && token.link) {
                  const isMasked = token.link.href !== token.raw;
                  decorations.push({
                     anchor: toPoint(token.end - token.link.href.length - (isMasked ? 1 : 0)),
                     focus: toPoint(token.end - (isMasked ? 1 : 0)),
                     link: true,
                  });
               }

               if (token.type === "codespan") {
                  decorations.push({
                     anchor: toPoint(token.start),
                     focus: toPoint(token.end),
                     codespan: true,
                  });
               }
            } else {
               decorations.push({
                  anchor: toPoint(token.start),
                  focus: toPoint(token.end),
                  bold: currentTokens.some((t) => t.type === "strong"),
                  italic: currentTokens.some((t) => t.type === "em"),
                  underline: currentTokens.some((t) => t.type === "underline"),
                  spoiler: currentTokens.some((t) => t.type === "spoiler"),
                  codespan: currentTokens.some((t) => t.type === "codespan"),
                  strikethrough: currentTokens.some((t) => t.type === "del"),
                  list: currentTokens.some((t) => t.type === "list-item"),
               });
            }
         }

         result.set(path[0], decorations);
      }

      return result;
   }

   const decorate = useCallback(
      ([_node, path]: [Node, Path]): Range[] => {
         if (path.length !== 1) return [];
         decorateVersion.toString(); // magic thingy to update all leaves
         return cachedDecorations.current.get(path[0]) ?? [];
      },
      [decorateVersion],
   );

   function convertEmojisToElements() {
      for (const [node, path] of Node.texts(editor)) {
         const text = node.text;
         if (!text) continue;

         const ranges = cachedDecorations.current.get(path[0]);
         if (ranges?.some((x) => x.codeToken)) continue;

         const tokens = marked.lexer(text);
         const organizedTokens = organizeMarkedTokens(tokens);

         const emojiToken = organizedTokens.find((t) => t.type === "emoji");
         if (!emojiToken) continue;

         if (
            ranges?.some(
               (x) => x.codespan && Range.includes(x, { path, offset: emojiToken.start }) && Range.includes(x, { path, offset: emojiToken.end }),
            )
         )
            continue;

         let deletePath = path;

         if (emojiToken.start === 0) {
            editor.insertNode({ text: "\uFEFF", throwaway: true }, { at: { path, offset: 0 } });
            deletePath = editor.after(path, { unit: "offset" })!.path;
         }

         editor.delete({ at: { anchor: { path: deletePath, offset: emojiToken.start }, focus: { path: deletePath, offset: emojiToken.end } } });

         const emojiElement: Element = {
            type: "emoji",
            slug: emojiToken.emoji!.slug,
            unicode: emojiToken.emoji!.unicode,
            id: emojiToken.emoji!.id,
            children: [{ text: "" }],
         };
         editor.insertNodes(emojiElement, { at: { path, offset: emojiToken.start } });

         editor.removeNodes({
            at: { anchor: editor.start([]), focus: editor.end([]) },
            match: (node) => Text.isText(node) && (node.throwaway ?? false),
         });

         if (editor.selection?.anchor.path.length === 3) editor.move({ unit: "offset" });
         if (editor.selection && Path.equals(editor.selection.anchor.path, path) && editor.selection.anchor.offset === emojiToken.start)
            editor.move({ distance: 2, unit: "offset" });

         return true;
      }

      return false;
   }

   function convertEmojisToSlugs() {
      for (const [node, path] of Node.elements(editor)) {
         if ((node as Element).type !== "emoji") continue;

         const slug = (node as EmojiElement).slug;
         const lineIndex = path[0];

         const ranges = cachedDecorations.current.get(lineIndex);
         if (ranges?.every((x) => !x.codeToken && (!x.codespan || path[1] >= x.focus.path[1] || path[1] <= x.anchor.path[1]))) continue;

         editor.withoutNormalizing(() => {
            editor.delete({ at: path });
            editor.insertNodes({ text: slug }, { at: path });
         });

         return true;
      }

      return false;
   }

   async function handleEditorOnChange() {
      cachedDecorations.current = calculateAllDecorations(editor);
      setDecorateVersion((v) => v + 1);

      let hasChanges = false;
      do {
         hasChanges = convertEmojisToElements();
      } while (hasChanges);

      await Promise.resolve();

      hasChanges = false;
      do {
         hasChanges = convertEmojisToSlugs();
      } while (hasChanges);
   }

   return { decorate, editor, renderElement, renderLeaf, handleEditorOnChange };
}
