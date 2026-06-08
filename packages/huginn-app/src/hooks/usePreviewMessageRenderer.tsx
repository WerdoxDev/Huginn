import EditorLeaf from "@components/editor/EditorLeaf";
import PreviewEmojiElement from "@components/editor/PreviewEmojiElement";
import { marked } from "@lib/marked";
import { organizeMarkedTokens } from "@lib/marked-utils";
import { useCallback, useMemo } from "react";
import { createEditor, Editor, Element, Node, Path, Range, Text } from "slate";
import { DefaultElement, withReact, type RenderElementProps, type RenderLeafProps } from "slate-react";

function withHuginn(editor: Editor) {
   const { isInline, insertText, isVoid } = editor;

   editor.isInline = (element) => {
      return element.type === "emoji" || isInline(element);
   };

   editor.isVoid = (element) => {
      return element.type === "emoji" || isVoid(element);
   };

   editor.insertText = (text, options) => {
      if (checkAndInsertEmojis(editor, text, insertText)) {
         return;
      }
      insertText(text, options);
   };

   return editor;
}

function checkAndInsertEmojis(editor: Editor, text: string, insertText: (text: string) => void) {
   const matches = text
      .replace(/[\uFE00-\uFE0F]/g, "")
      .matchAll(
         /(\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\u200d[\p{Extended_Pictographic}\p{Emoji_Presentation}]|[\u{1f3fb}-\u{1f3ff}]|\ufe0f)*/gu,
      );

   let lastIndex = 0;
   let matchCount = 0;
   for (const match of matches) {
      matchCount++;
      editor.insertNode({ text: "\uFEFF", throwaway: true });

      const matchStart = match.index ?? 0;
      const matchEnd = matchStart + match[0].length + 1;

      if (matchStart > lastIndex) {
         insertText(text.slice(lastIndex, matchStart));
      }

      insertEmoji(editor, match[0]);

      lastIndex = matchEnd;
      editor.removeNodes({
         at: { anchor: editor.start([]), focus: editor.end([]) },
         match: (node) => Text.isText(node) && (node.throwaway ?? false),
      });
      editor.move({ unit: "offset" });
   }
   if (lastIndex < text.length && matchCount > 0) {
      insertText(text.slice(lastIndex));
   }

   return matchCount > 0;
}

function insertEmoji(editor: Editor, text: string) {
   const emojiId = [...text].map((x) => x.codePointAt(0)?.toString(16)).join("-");
   const emoji: Element = {
      type: "emoji",
      emojiId: emojiId,
      emoji: text,
      children: [{ text: "" }],
   };

   editor.insertNodes(emoji);
   return emoji;
}

export function usePreviewMessageRenderer() {
   const editor = useMemo(() => withHuginn(withReact(createEditor())), []);

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

   function calculateRanges(lineIndex: number) {
      const decorations: Range[] = [];
      const children = getAllChildren();

      const text = children.map((x) => Node.string(x[0])).join("\n");

      const tokens = marked.lexer(text);
      const organizedTokens = organizeMarkedTokens(tokens);
      const filteredTokens = organizedTokens.filter((t) => t.line === lineIndex);

      let currentTokens: Array<{ start: number; end: number; type: string }> = [];
      for (const token of filteredTokens) {
         currentTokens = currentTokens.filter((t) => t.end > token.start);
         if (token.type !== "text") {
            currentTokens.push({
               start: token.start,
               end: token.end,
               type: token.type,
            });

            if (token.mark && token.type !== "link") {
               decorations.push({
                  anchor: { path: [lineIndex, 0], offset: token.start },
                  focus: { path: [lineIndex, 0], offset: token.start + token.mark.length },
                  mark: true,
               });
               if (token.type !== "code-fence-open" && token.type !== "code-fence-close" && token.type !== "list-item") {
                  decorations.push({
                     anchor: { path: [lineIndex, 0], offset: token.end - token.mark.length },
                     focus: { path: [lineIndex, 0], offset: token.end },
                     mark: true,
                  });
               }
               if (token.type === "code-fence-open" && token.code?.lang) {
                  decorations.push({
                     anchor: { path: [lineIndex, 0], offset: token.start + token.mark.length },
                     focus: { path: [lineIndex, 0], offset: token.start + token.mark.length + token.code.lang.length },
                     codeLanguage: true,
                  });
               }
            }

            if (token.type === "code-line" && token.code?.tokens) {
               decorations.push(
                  ...token.code.tokens.map(
                     (x) =>
                        ({
                           anchor: { path: [lineIndex, 0], offset: token.start + x.start },
                           focus: { path: [lineIndex, 0], offset: token.start + x.end },
                           codeToken: x.types.length === 0 ? true : x.types.join(" "),
                        }) as Range,
                  ),
               );
            }

            if (token.type === "link" && token.link) {
               decorations.push({
                  anchor: { path: [lineIndex, 0], offset: token.end - token.link.href.length - 1 },
                  focus: { path: [lineIndex, 0], offset: token.end - 1 },
                  link: true,
               });
            }
         } else {
            decorations.push({
               anchor: { path: [lineIndex, 0], offset: token.start },
               focus: { path: [lineIndex, 0], offset: token.end },
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

      return decorations;
   }

   function decorate([_node, path]: [Node, Path]) {
      const ranges = calculateRanges(path[0]);
      return ranges;
   }

   return { decorate, editor, renderElement, renderLeaf };
}
