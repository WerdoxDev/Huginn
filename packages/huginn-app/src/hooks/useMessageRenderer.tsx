import AttachmentElement from "@components/editor/AttachmentElement";
import CodeElement from "@components/editor/CodeElement";
import CodespanElement from "@components/editor/CodespanElement";
import EmbedElement from "@components/editor/EmbedElement";
import LinkElement from "@components/editor/LinkElement";
import ListElement from "@components/editor/ListElement";
import ListItemElement from "@components/editor/ListItemElement";
import MessageEmojiElement from "@components/editor/MessageEmojiElement";
import MessageLeaf from "@components/editor/MessageLeaf";
import SpoilerElement from "@components/editor/SpoilerElement";
import { CONSTANTS } from "@huginn/shared";
import { marked } from "@lib/marked";
import { organizeMarkedTokens } from "@lib/marked-utils";
import clsx from "clsx";
import { useMemo } from "react";
import { Element, Text, type Descendant } from "slate";

import type { AppMessage, MarkedToken } from "@/types";

import type { CustomElement, ListItemElement as SlateListItemElement, ParagraphElement } from "..";

export function useMessageRenderer(message: AppMessage, excludeElements?: CustomElement["type"][], noWrapping?: boolean) {
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

   function childrenRenderer(node: Descendant, index: number, parentKey?: string) {
      const key = parentKey
         ? Element.isElement(node)
            ? parentKey + `-${node.type}-${index}`
            : parentKey + `-text-${index}`
         : Element.isElement(node)
           ? `${message.id}_${node.type}-${index}`
           : "";

      if (Element.isElement(node) && !excludeElements?.includes(node.type)) {
         const children = node.children.map((node, index) => childrenRenderer(node, index, key));

         switch (node.type) {
            case "paragraph":
               return (
                  <div
                     key={key}
                     className={clsx("[text-box-edge:text_text]!", noWrapping ? "w-full overflow-hidden text-ellipsis whitespace-nowrap" : "w-fit")}
                  >
                     {children}
                  </div>
               );
            case "spoiler":
               return <SpoilerElement key={key}>{children}</SpoilerElement>;
            case "link":
               return (
                  <LinkElement url={node.url} key={key} noWrapping={noWrapping}>
                     {children}
                  </LinkElement>
               );
            case "emoji":
               return <MessageEmojiElement emoji={node.emoji} slug={node.slug} big={node.big} key={key} />;
            case "code":
               return <CodeElement code={node.code} language={node.language} key={key} />;
            case "codespan":
               return <CodespanElement key={key}>{children}</CodespanElement>;
            case "attachment":
               return <AttachmentElement {...node} key={key} />;
            case "embed":
               return <EmbedElement {...node} key={key} />;
            case "ordered-list":
               return (
                  <ListElement key={key} ordered>
                     {children}
                  </ListElement>
               );
            case "list-item":
               return <ListItemElement key={key}>{children}</ListItemElement>;
            case "unordered-list":
               return <ListElement key={key}>{children}</ListElement>;
         }
      } else if (Text.isText(node)) {
         return (
            <MessageLeaf {...node} key={key}>
               {node.text}
            </MessageLeaf>
         );
      }
   }

   const elementTypes = new Set(["spoiler", "link"]);

   function renderInlineTokens(root: CustomElement, inlineTokens: Array<MarkedToken>) {
      let currentTokens: Array<{ start: number; end: number; type: string }> = [];
      let currentPath: number[] = [];

      const canRenderBigEmoji =
         inlineTokens.every((t) => t.type === "emoji" || (t.type === "text" && /^\s*$/.test(t.raw))) &&
         inlineTokens.filter((t) => t.type === "emoji").length <= CONSTANTS.MAX_BIG_EMOJI_COUNT;
      console.log(root, inlineTokens, canRenderBigEmoji);

      for (const token of inlineTokens) {
         const prevTokens = currentTokens;
         currentTokens = currentTokens.filter((t) => t.end > token.start);

         const prevElementCount = prevTokens.filter((t) => elementTypes.has(t.type)).length;
         const newElementCount = currentTokens.filter((t) => elementTypes.has(t.type)).length;
         if (newElementCount < prevElementCount) {
            currentPath = currentPath.slice(0, newElementCount);
         }

         const deepestNode = !currentPath.length ? root : getNodeByPath(root, currentPath);

         if (token.type === "spoiler") {
            deepestNode.children.push({ type: "spoiler", children: [] });
            currentPath.push(deepestNode.children.length - 1);
            currentTokens.push({ start: token.start, end: token.end, type: token.type });
         } else if (token.type === "emoji" && token.emoji) {
            deepestNode.children.push({ type: "emoji", slug: token.emoji.slug, emoji: token.emoji.emoji, big: canRenderBigEmoji, children: [] });
         } else if (token.type === "link") {
            deepestNode.children.push({ type: "link", url: token.link?.href, children: [] });
            currentPath.push(deepestNode.children.length - 1);
            currentTokens.push({ start: token.start, end: token.end, type: token.type });
         } else if (token.type === "codespan" && token.text) {
            deepestNode.children.push({ type: "codespan", children: [{ text: token.text }] });
         } else if (token.type === "text") {
            deepestNode.children.push({
               text: token.raw,
               bold: currentTokens.some((t) => t.type === "strong"),
               italic: currentTokens.some((t) => t.type === "em"),
               underline: currentTokens.some((t) => t.type === "underline"),
               strikethrough: currentTokens.some((t) => t.type === "del"),
            });
         } else {
            currentTokens.push({ start: token.start, end: token.end, type: token.type });
         }
      }
   }

   const nodes = useMemo(() => {
      let nodes: Descendant[] = [];

      const tokens = marked.lexer(message.content);
      const organizedTokens = organizeMarkedTokens(tokens);

      if (!message.isPreview) {
         for (const attachment of message.attachments) {
            nodes.push({
               type: "attachment",
               url: attachment.url,
               description: attachment.description,
               children: [{ text: "" }],
               height: attachment?.height,
               width: attachment?.width,
               size: attachment.size,
               contentType: attachment.contentType,
               filename: attachment.filename,
            });
         }
      }

      function flushLine(lineElement: ParagraphElement, lineIndex: number, targetLine: number) {
         if (lineElement.children.length) {
            nodes.push(lineElement);
         }
         for (let j = lineIndex + 1; j < targetLine; j++) {
            nodes.push({ type: "paragraph", children: [{ text: " " }] });
         }
      }

      let lineIndex = 0;
      let lineElement: ParagraphElement = { type: "paragraph", children: [] };

      let i = 0;
      while (i < organizedTokens.length) {
         const token = organizedTokens[i];

         if (token.type === "code-fence-open") {
            flushLine(lineElement, lineIndex, token.line);

            const lang = token.raw.replace(/^(`{3}|~{3})/, "").trim();
            let closeLine = token.line;
            const codeLines: string[] = [];
            i++;

            while (i < organizedTokens.length && organizedTokens[i].type !== "code-fence-close") {
               codeLines.push(organizedTokens[i].raw);
               closeLine = organizedTokens[i].line;
               i++;
            }
            if (i < organizedTokens.length && organizedTokens[i].type === "code-fence-close") {
               closeLine = organizedTokens[i].line;
               i++;
            }

            nodes.push({ type: "code", language: lang, code: codeLines.join("\n"), children: [{ text: "" }] });
            lineIndex = closeLine;
            lineElement = { type: "paragraph", children: [] };
            continue;
         }

         if (token.type === "list-item" && token.list?.index === 0) {
            flushLine(lineElement, lineIndex, token.line);

            const listItems: SlateListItemElement[] = [];
            let j = i;

            while (j < organizedTokens.length && organizedTokens[j].type === "list-item") {
               const itemToken = organizedTokens[j];
               const itemLine = itemToken.line;
               j++;

               const itemRoot: SlateListItemElement = { type: "list-item", children: [] };

               // Collect all inline tokens for this item's line
               const itemInlineTokens: Array<MarkedToken> = [];
               while (j < organizedTokens.length && organizedTokens[j].line === itemLine) {
                  itemInlineTokens.push(organizedTokens[j]);
                  j++;
               }

               renderInlineTokens(itemRoot, itemInlineTokens);
               listItems.push(itemRoot);
            }

            nodes.push({
               type: token.list?.ordered ? "ordered-list" : "unordered-list",
               children: listItems,
            });

            lineIndex = organizedTokens[j - 1]?.line ?? lineIndex;
            lineElement = { type: "paragraph", children: [] };
            i = j;
            continue;
         }

         if (token.line > lineIndex) {
            flushLine(lineElement, lineIndex, token.line);
            lineIndex = token.line;
            lineElement = { type: "paragraph", children: [] };
         }

         // Collect all tokens on this line and render them together
         const lineTokens: Array<MarkedToken> = [];
         while (i < organizedTokens.length && organizedTokens[i].line === lineIndex) {
            lineTokens.push(organizedTokens[i]);
            i++;
         }

         renderInlineTokens(lineElement, lineTokens);
      }

      nodes.push(lineElement);

      if (message.isPreview) return nodes;

      for (const embed of message.embeds) {
         nodes.push({
            type: "embed",
            thumbnail: embed.thumbnail,
            video: embed.video,
            url: embed.url,
            description: embed.description,
            title: embed.title,
            children: [{ text: "" }],
         });
      }

      return nodes;
   }, [message]);

   const children = useMemo(() => {
      return nodes.map((node, index) => childrenRenderer(node, index));
   }, [nodes]);

   return { children };
}
