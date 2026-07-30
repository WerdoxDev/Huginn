import EditorLeaf from "@components/editor/EditorLeaf";
import PreviewEmojiElement from "@components/editor/PreviewEmojiElement";
import PreviewMentionElement from "@components/editor/PreviewMentionElement";
import { marked, organizeMarkedTokens, type MarkedToken } from "@huginnjs/shared";
import { getUser } from "@lib/query-utils";
import { serializeSlate } from "@lib/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { Point, type Descendant } from "slate";
import { createEditor, Editor, Element, Node, Path, Range, Text } from "slate";
import { DefaultElement, withReact, type RenderElementProps, type RenderLeafProps } from "slate-react";

import type { AutocompleteItem, AutocompleteType } from "@/types";

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

      if (Element.isElement(node) && node.type === "mention") {
         if (node.mentionType === "everyone" || node.mentionType === "owner") text += "@" + node.usedText;
         else if (node.mentionType === "user") {
            const user = getUser(node.userId);
            text += user ? "@" + user.displayName : "<@" + node.userId + ">";
         }
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
      return element.type === "emoji" || element.type === "mention" || isInline(element);
   };

   editor.isVoid = (element) => {
      return element.type === "emoji" || element.type === "mention" || isVoid(element);
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

export function usePreviewMessageRenderer(options?: {
   onSetAutocomplete?: (type: AutocompleteType, query: string) => void;
   onCloseAutocomplete?: () => void;
}) {
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
         case "mention":
            return <PreviewMentionElement {...props} />;
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

            if (Element.isElement(node) && (node.type === "emoji" || node.type === "mention")) {
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

   function collapsedLineOffsetToPoint(editor: Editor, lineIndex: number, charOffset: number, startIndex: number = 0): Point {
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

   function getNodeAfterOffset(editor: Editor, lineIndex: number, charOffset: number, startIndex: number = 0): Point | undefined {
      const lineNode = editor.children[lineIndex] as Element;

      let remaining = charOffset;

      for (let i = startIndex; i < lineNode.children.length; i++) {
         const child = lineNode.children[i];
         const childPath = [lineIndex, i];

         if (Editor.isVoid(editor, child as Element)) {
            // each void gets its own length - don't reuse a constant,
            // different void types serialize to different widths
            const voidLen = serializeSlate([child], { emojiAsSlug: true }).length;

            if (remaining <= voidLen) {
               // distance here is 2 because we have to get out of the void element and then move once more for the next node
               return editor.after({ path: childPath, offset: 0 }, { distance: 2 });
            }

            remaining -= voidLen;
            continue;
         }

         const textLen = Node.string(child).length;

         if (remaining <= textLen) {
            return editor.after({ path: childPath, offset: remaining });
         }

         remaining -= textLen;
      }

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
         const toPoint = (offset: number) => collapsedLineOffsetToPoint(editor, lineIndex, offset);

         const decorations: Range[] = [];
         let currentTokens: Array<{ start: number; end: number; type: string }> = [];

         for (const token of filteredTokens) {
            currentTokens = currentTokens.filter((t) => t.end > token.start);

            // Mention means an unfinished mention token
            if (token.type !== "text" && token.type !== "mention") {
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

               if (token.type === "escape") {
                  decorations.push({
                     anchor: toPoint(token.start),
                     focus: toPoint(token.end - 1),
                     mark: true,
                     escape: true,
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

   function isVoidToken(token: MarkedToken) {
      if (token.type === "emoji") return true;
      if (token.type === "internal-mention") return true;
      return false;
   }

   function isVoidElement(element: Element) {
      if (element.type === "emoji") return true;
      if (element.type === "mention") return true;
      return false;
   }

   function convertVoidTokensToElements() {
      for (const [node, path] of Node.texts(editor)) {
         const text = node.text;
         if (!text) continue;

         const ranges = cachedDecorations.current.get(path[0]);
         if (ranges?.some((x) => x.codeToken)) continue;

         const tokens = marked.lexer(text);
         const organizedTokens = organizeMarkedTokens(tokens);

         const voidToken = organizedTokens.find((t) => isVoidToken(t) === true);
         if (!voidToken) continue;

         if (
            ranges?.some(
               (x) => x.codespan && Range.includes(x, { path, offset: voidToken.start }) && Range.includes(x, { path, offset: voidToken.end }),
            )
         )
            continue;

         let deletePath = path;

         if (voidToken.start === 0) {
            editor.insertNode({ text: "\uFEFF", throwaway: true }, { at: { path, offset: 0 } });
            deletePath = editor.after(path, { unit: "offset" })!.path;
         }

         console.log(voidToken);

         editor.delete({ at: { anchor: { path: deletePath, offset: voidToken.start }, focus: { path: deletePath, offset: voidToken.end } } });

         const voidElement = buildVoidElement(voidToken);
         editor.insertNodes(voidElement, { at: { path, offset: voidToken.start } });

         editor.removeNodes({
            at: { anchor: editor.start([]), focus: editor.end([]) },
            match: (node) => Text.isText(node) && (node.throwaway ?? false),
         });

         if (editor.selection?.anchor.path.length === 3) editor.move({ unit: "offset" });
         if (editor.selection && Path.equals(editor.selection.anchor.path, path) && editor.selection.anchor.offset === voidToken.start)
            editor.move({ distance: 2, unit: "offset" });

         return true;
      }

      return false;
   }

   function buildVoidElement(token: MarkedToken): Element {
      if (token.type === "emoji") {
         return {
            type: "emoji",
            slug: token.emoji!.slug,
            unicode: token.emoji!.unicode,
            id: token.emoji!.id,
            children: [{ text: "" }],
         };
      } else if (token.type === "internal-mention") {
         if (token.internalMention?.type === "user") {
            return {
               type: "mention",
               mentionType: "user",
               userId: token.internalMention!.text,
               children: [{ text: "" }],
            };
         }
         if (token.internalMention?.type === "everyone") {
            return {
               type: "mention",
               mentionType: "everyone",
               usedText: token.internalMention!.text,
               children: [{ text: "" }],
            };
         }
         if (token.internalMention?.type === "owner") {
            return {
               type: "mention",
               mentionType: "owner",
               usedText: token.internalMention!.text,
               children: [{ text: "" }],
            };
         } else throw new Error(`Unsupported internal mention type: ${token.internalMention?.type}`);
      } else throw new Error(`Unsupported void token type: ${token.type}`);
   }

   function convertVoidsToText() {
      const text = serializeSlate(editor.children, { emojiAsSlug: true });
      const tokens = organizeMarkedTokens(marked.lexer(text));

      const voidTokenByPath: Array<{ path: Path; token: MarkedToken }> = [];
      for (const token of tokens.filter(isVoidToken)) {
         const line = token.line;
         const point = getNodeAfterOffset(editor, line, token.start);
         if (!point) continue;
         voidTokenByPath.push({ path: point.path.slice(0, 2), token });
      }

      for (const [node, path] of Node.elements(editor)) {
         if (!isVoidElement(node)) continue;

         const line = path[0];
         const token = voidTokenByPath.find((v) => v.token.line === line && v.path[1] === path[1])?.token;

         const text = serializeSlate([node], { emojiAsSlug: true });

         // No longer a token
         if (!token) {
            editor.withoutNormalizing(() => {
               editor.delete({ at: path });
               editor.insertNodes({ text: text }, { at: path });
            });

            return true;
         }
      }

      return false;
   }

   const currentMentionRef = useRef<{ path: Path; token: ReturnType<typeof organizeMarkedTokens>[number] } | null>(null);

   function checkAndShowAutocomplete() {
      const { selection } = editor;
      if (!selection || !Range.isCollapsed(selection)) {
         options?.onCloseAutocomplete?.();
         return;
      }

      for (const [node, path] of Node.texts(editor)) {
         if (path[0] !== selection.anchor.path[0]) continue;

         const tokens = marked.lexer(node.text);
         const organizedTokens = organizeMarkedTokens(tokens).filter((x) => x.mention);

         const mentionToken = organizedTokens.find((t) =>
            Range.includes({ anchor: { path, offset: t.start }, focus: { path, offset: t.end } }, selection.anchor),
         );

         if (!mentionToken || !mentionToken.mention || !mentionToken.mention) continue;

         if (selection.anchor.offset >= mentionToken.start + mentionToken.mention.queryIndex) {
            if (mentionToken.mention?.type === "user") {
               currentMentionRef.current = { path, token: mentionToken };
               options?.onSetAutocomplete?.("user", mentionToken.mention.text);
               return;
            }
         }
      }

      currentMentionRef.current = null;
      options?.onCloseAutocomplete?.();
   }

   function handleAutocompleteSelect(item: AutocompleteItem) {
      const { selection } = editor;
      if (!selection || !Range.isCollapsed(selection)) return;

      const mention = currentMentionRef.current;
      if (!mention) return;

      const range: Range = { anchor: { path: mention.path, offset: mention.token.start }, focus: { path: mention.path, offset: mention.token.end } };

      editor.select(range);
      editor.delete();
      if (item.type === "special") {
         editor.insertText(`@${item.ids[0]} `);
      } else {
         editor.insertText(`<@${item.id}> `);
      }
   }

   function handleEditorClick() {
      checkAndShowAutocomplete();
   }

   async function handleEditorChange() {
      cachedDecorations.current = calculateAllDecorations(editor);
      setDecorateVersion((v) => v + 1);

      let hasChanges = false;
      do {
         hasChanges = convertVoidTokensToElements();
      } while (hasChanges);

      checkAndShowAutocomplete();

      await Promise.resolve();

      hasChanges = false;
      do {
         hasChanges = convertVoidsToText();
      } while (hasChanges);
   }

   return { decorate, editor, renderElement, renderLeaf, handleEditorChange, handleEditorClick, handleAutocompleteSelect };
}
