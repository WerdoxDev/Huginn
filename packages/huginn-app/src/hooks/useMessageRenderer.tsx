import AttachmentElement from "@components/editor/AttachmentElement";
import CodeElement from "@components/editor/CodeElement";
import EmbedElement from "@components/editor/EmbedElement";
import InlineCodeElement from "@components/editor/InlineCodeElement";
import LinkElement from "@components/editor/LinkElement";
import MessageLeaf from "@components/editor/MessageLeaf";
import SpoilerElement from "@components/editor/SpoilerElement";
import { markdownMainMessage } from "@lib/markdown-main";
import { markdownSpoiler } from "@lib/markdown-spoiler";
import { markdownUnderline } from "@lib/markdown-underline";
import { organizeTokens, isElementOpenToken, isElementCloseToken, isOpenToken, isCloseToken, getSlateFormats } from "@lib/markdown-utils";
import clsx from "clsx";
import markdownit from "markdown-it";
import { useMemo } from "react";
import { Element, Text, type Descendant } from "slate";

import type { AppMessage, HuginnToken } from "@/types";

import type { CustomElement, ParagraphElement } from "..";

export function useMessageRenderer(message: AppMessage, excludeElements?: CustomElement["type"][], noWrapping?: boolean) {
   const md = useMemo(() => new markdownit({ linkify: true }).use(markdownSpoiler).use(markdownUnderline).use(markdownMainMessage), []);

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
                  <LinkElement url={node.url} key={key}>
                     {children}
                  </LinkElement>
               );
            case "code":
               return <CodeElement code={node.code} language={node.language} key={key} />;
            case "code_inline":
               return <InlineCodeElement key={key}>{children}</InlineCodeElement>;
            case "attachment":
               return <AttachmentElement {...node} key={key} />;
            case "embed":
               return <EmbedElement {...node} key={key} />;
         }
      } else if (Text.isText(node)) {
         return (
            <MessageLeaf {...node} key={key}>
               {node.text}
            </MessageLeaf>
         );
      }
   }

   const nodes = useMemo(() => {
      let nodes: Descendant[] = [];

      const result = md.parse(message.content, {});
      const tokens = organizeTokens(result);

      let lineNode: ParagraphElement = { type: "paragraph", children: [] };
      const currentPath: number[] = [];
      const currentOpenedTokens: HuginnToken[] = [];

      // Render attachments
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
                  deepestNode.children.push({
                     type: "link",
                     children: [],
                     url: token.attrs?.[0][1],
                  });
               } else if (token.type === "spoiler_open") {
                  deepestNode.children.push({ type: "spoiler", children: [] });
               } else if (token.type === "fence_open") {
                  deepestNode.children.push({
                     type: "code",
                     children: [{ text: "" }],
                     code: token.content,
                     language: token.info,
                  });
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

      if (message.embeds.length === 1) {
         const embed = message.embeds[0];
         if ((embed.type === "image" || embed.type === "video") && embed.url === message.content) {
            nodes = [];
         }
      }

      // Render embeds
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
