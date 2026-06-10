import EditorLeaf from "@components/editor/EditorLeaf";
import PreviewEmojiElement from "@components/editor/PreviewEmojiElement";
import { marked } from "@lib/marked";
import { organizeMarkedTokens } from "@lib/marked-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { Point, Transforms } from "slate";
import { createEditor, Editor, Element, Node, Path, Range, Text } from "slate";
import { DefaultElement, withReact, type RenderElementProps, type RenderLeafProps } from "slate-react";

import type { EmojiElement } from "..";

function withHuginn(editor: Editor) {
   const { isInline, insertText, isVoid } = editor;

   editor.isInline = (element) => {
      return element.type === "emoji" || isInline(element);
   };

   editor.isVoid = (element) => {
      return element.type === "emoji" || isVoid(element);
   };

   editor.insertText = (text, options) => {
      // if (checkAndInsertEmojis(editor, text, insertText)) {
      //    return;
      // }
      insertText(text, options);
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

   const getAllChildren = useCallback(() => {
      const children = Array.from(
         Editor.nodes(editor, {
            at: [],
            mode: "highest",
            match: (node, _path) => Element.isElement(node),
         }),
      );

      return children;
   }, [editor]);

   function lineOffsetToPoint(editor: Editor, lineIndex: number, charOffset: number): Point {
      const lineNode = editor.children[lineIndex] as Element;

      let remaining = charOffset;

      for (let i = 0; i < lineNode.children.length; i++) {
         const child = lineNode.children[i];
         const childPath = [lineIndex, i];

         // Skip void/inline elements (emojis) — they contribute 0 chars
         if (Editor.isVoid(editor, child as Element)) {
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
      const children = getAllChildren();
      const text = children.map((x) => Node.string(x[0])).join("\n");

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
                  decorations.push({
                     anchor: toPoint(token.end - token.link.href.length - 1),
                     focus: toPoint(token.end - 1),
                     link: true,
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
                  inlineCode: currentTokens.some((t) => t.type === "codespan"),
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

   const iter = useRef(0);
   function replaceEmojis() {
      iter.current++;
      // if (iter.current > 10) return; // safety check to prevent infinite loops
      const replacements: Array<{
         path: Path;
         start: number;
         end: number;
         slug: string;
         emoji: string;
         initial: "slug" | "emoji";
         asElement?: boolean;
      }> = [];

      // Walk every text node individually
      for (const [node, path] of Node.texts(editor)) {
         const ranges = cachedDecorations.current.get(path[0]);
         if (ranges?.some((x) => x.codeToken)) continue; // skip code blocks
         const text = node.text;
         const tokens = marked.lexer(text);
         const organizedTokens = organizeMarkedTokens(tokens);
         const emojiTokens = organizedTokens.filter((t) => t.type === "emoji");

         for (const emojiToken of emojiTokens) {
            replacements.push({
               path,
               start: emojiToken.start,
               end: emojiToken.end,
               slug: emojiToken.emoji!.slug,
               emoji: emojiToken.emoji!.emoji,
               initial: emojiToken.emoji!.initial,
            });
         }
      }

      if (replacements.length === 0) return;

      // Sort in reverse order (last offset first) so earlier offsets stay valid
      replacements.sort((a, b) => {
         const pathCmp = Path.compare(b.path, a.path);
         if (pathCmp !== 0) return pathCmp;
         return b.start - a.start; // reverse offset order within same path
      });

      // Wrap in a single batch to produce one undo step
      // Editor.withoutNormalizing(editor, () => {
      // console.log(replacements);

      let insertionCount = 0;
      let firstInsertedAt: Path | null = null;
      let lastInsertedAt: Path | null = null;

      for (const { path, start, end, slug, emoji } of replacements) {
         let deletePath = path;
         if (start === 0) {
            // editor.insertText("\uFEFF", );
            editor.insertNode({ text: "\uFEFF", throwaway: true }, { at: { path, offset: 0 } });
            deletePath = editor.after(path, { unit: "offset" })!.path;
         }

         // Delete the matched text
         editor.delete({ at: { anchor: { path: deletePath, offset: start }, focus: { path: deletePath, offset: end } } });

         // Insert the emoji node where the text was
         const emojiElement: Element = { type: "emoji", slug, emoji, children: [{ text: "" }] };
         editor.insertNodes(emojiElement, { at: { path, offset: start } });

         firstInsertedAt = firstInsertedAt ?? path;
         lastInsertedAt = path;
         // if (!firstInsertedEmoji) {
         //    firstInsertedEmoji = emojiElement;
         // }

         editor.removeNodes({
            at: { anchor: editor.start([]), focus: editor.end([]) },
            match: (node) => Text.isText(node) && (node.throwaway ?? false),
         });

         insertionCount++;
      }

      if (insertionCount && firstInsertedAt && lastInsertedAt) {
         const adjustedPath: Path = [...firstInsertedAt.slice(0, -1), firstInsertedAt[firstInsertedAt.length - 1] + (insertionCount - 1) * 2];
         const after = editor.after(adjustedPath, { distance: 2 });
         const before = editor.start(lastInsertedAt);
         const selection = editor.selection;
         if (after && before && selection && Range.surrounds({ anchor: after, focus: before }, selection)) {
            editor.select(after);
         }
      }

      // if (firstInsertedEmoji) {

      // }

      // asdasd a💀 asdad 💀 🔧 💀 💀 💀 💀 asd
      // });
      // editor.move({ unit: "offset", distance: 2 });
   }
   function replaceEmojiElementsInCode() {
      const replacements: Array<{
         path: Path;
         slug: string;
         emoji: string;
      }> = [];

      // Walk every emoji element node
      for (const [node, path] of Node.elements(editor)) {
         if ((node as Element).type !== "emoji") continue;

         const slug = (node as EmojiElement).slug;
         const emoji = (node as EmojiElement).emoji;
         const lineIndex = path[0];

         // Get cached decorations for this line
         const ranges = cachedDecorations.current.get(lineIndex);
         if (ranges?.some((x) => x.codeToken)) {
            // console.log(path, node);
            replacements.push({ path, slug, emoji });
         }
      }

      if (replacements.length === 0) return;

      // Reverse so deeper/later paths don't shift earlier ones
      replacements.sort((a, b) => {
         const cmp = Path.compare(b.path, a.path);
         return cmp;
      });

      Editor.withoutNormalizing(editor, () => {
         for (const { path, slug } of replacements) {
            // Replace the void emoji node with plain text
            editor.delete({ at: path });
            // editor.removeNodes({ at: path });
            editor.insertNodes({ text: slug }, { at: path });
         }
      });
   }

   function handleEditorOnChange() {
      // Collect all replacements first, then apply in reverse order

      cachedDecorations.current = calculateAllDecorations(editor);
      setDecorateVersion((v) => v + 1); // bump so decorate is seen as "new"

      replaceEmojiElementsInCode();
      replaceEmojis();
   }

   return { decorate, editor, renderElement, renderLeaf, handleEditorOnChange };
}
