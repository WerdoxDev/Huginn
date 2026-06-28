// import type Token from "markdown-it/lib/token.mjs";
import type { Token, Tokens, TokensList } from "marked";

import hljs from "highlight.js";

import type { MarkedCodeToken, MarkedToken } from "@/types";

export function organizeMarkedTokens(tokens: TokensList): Array<MarkedToken> {
   const ranges: Array<MarkedToken> = [];

   const MARK_CHARS = {
      underline: () => "__",
      spoiler: () => "||",
      em: (raw: string) => raw[0],
      strong: () => "**",
      del: () => "~~",
      code: (raw: string) => raw[0],
      link: () => "[",
   };

   function pushRange(
      type: string,
      options: {
         mark: string | null;
         line: number;
         start: number;
         end: number;
         raw: string;
         text?: string;
         code?: { lang?: string; tokens?: Array<MarkedCodeToken> };
         link?: { href: string };
         list?: { ordered: boolean; index: number; total: number };
         emoji?: { id: string; unicode?: string; slug?: string; initial: "slug" | "emoji" };
      },
   ) {
      // const existing = ranges.find((r) => r.line === line && r.start === start && r.end === end);
      // if (existing) {
      //    existing.type = type;
      //    existing.mark = mark;
      //    return;
      // }
      ranges.push({ type, ...options });
   }

   function handleCodeBlock(token: Tokens.Code, lineIndex: number) {
      const fence = "```";
      const lines = token.raw.split("\n");
      const trimmed = lines.at(-1) === "" ? lines.slice(0, -1) : lines;

      let hasFenceClose = false;

      let codeTokens = tokenizeHighlightJS(token.text, getCodeLanguage(token.lang ?? "md"));

      let codeLineIndex = 0;
      for (let i = 0; i < trimmed.length; i++) {
         const raw = trimmed[i];

         if (i === 0) {
            pushRange("code-fence-open", { mark: fence, line: lineIndex, start: 0, end: raw.length, raw, code: { lang: token.lang } });
         } else if (raw.startsWith(fence)) {
            pushRange("code-fence-close", { mark: fence, line: lineIndex, start: 0, end: raw.length, raw });
            hasFenceClose = true;
         } else {
            pushRange("code-line", {
               mark: null,
               line: lineIndex,
               start: 0,
               end: raw.length,
               raw,
               code: { lang: token.lang, tokens: codeTokens.filter((t) => t.line === codeLineIndex) },
            });
            codeLineIndex++;
         }

         lineIndex += 1;
      }

      if (!hasFenceClose) {
         pushRange("code-fence-close", { mark: fence, line: lineIndex, start: 0, end: fence.length, raw: fence });
         lineIndex += 1;
      }

      return lineIndex;
   }

   function handleList(token: Tokens.List, lineIndex: number) {
      const total = token.items.length;

      for (let i = 0; i < token.items.length; i++) {
         const item = token.items[i];

         // Emit the list-item-open marker so the renderer knows a new item starts
         const marker = token.ordered ? `${(token.start as string) + i}.` : "-";
         pushRange("list-item", {
            mark: marker,
            line: lineIndex,
            start: 0,
            end: item.raw.length,
            raw: item.raw,
            list: { ordered: token.ordered, index: i, total },
         });

         // Walk the item's inline tokens at offset = marker width + space (e.g. "- " or "1. ")
         const prefixLength = marker.length + 1;
         item.tokens = item.tokens.length > 0 && "tokens" in item.tokens[0] ? (item.tokens[0].tokens ?? []) : [];
         lineIndex = walk(item.tokens, lineIndex, prefixLength);

         lineIndex += 1;
      }

      return lineIndex;
   }

   function walk(tokenList: Token[], lineIndex: number, offset: number) {
      for (const token of tokenList) {
         const isMark = token.type in MARK_CHARS;
         const mark = isMark ? MARK_CHARS[token.type as keyof typeof MARK_CHARS](token.raw) : null;

         if (token.type === "text" && token.raw.includes("\n")) {
            const parts = token.raw.split("\n");
            for (let i = 0; i < parts.length; i++) {
               const part = parts[i];
               if (part.length > 0) {
                  pushRange("text", { mark: null, line: lineIndex, start: offset, end: offset + part.length, raw: part });
                  offset += part.length;
                  // }
               }
               if (i < parts.length - 1) {
                  lineIndex += 1;
                  offset = 0;
               }
            }
            continue;
         }

         if (token.type === "link") {
            pushRange("link", {
               mark: " ",
               line: lineIndex,
               start: offset,
               end: offset + token.raw.length,
               raw: token.raw,
               link: { href: token.href },
            });
         } else if (token.type === "emoji") {
            pushRange("emoji", {
               mark: null,
               line: lineIndex,
               start: offset,
               end: offset + token.raw.length,
               raw: token.raw,
               emoji: { id: token.id, slug: token.slug, unicode: token.unicode, initial: token.initial },
            });
         } else if (token.type === "codespan") {
            pushRange("codespan", { mark: null, text: token.text, line: lineIndex, start: offset, end: offset + token.raw.length, raw: token.raw });
         } else {
            pushRange(token.type, { mark, line: lineIndex, start: offset, end: offset + token.raw.length, raw: token.raw });
         }

         if ("tokens" in token && token.tokens) {
            const innerOffset = isMark ? offset + mark!.length : offset;
            walk(token.tokens, lineIndex, innerOffset);
         }

         offset += token.raw.length;
      }

      return lineIndex;
   }

   let lineIndex = 0;
   for (const block of tokens) {
      if (block.type === "space") {
         if (lineIndex === 0) lineIndex += block.raw.split("\n").length - 1;
         else lineIndex += block.raw.split("\n").length - 2;
         continue;
      }

      if (block.type === "code" && !block.codeBlockStyle) {
         lineIndex = handleCodeBlock(block as Tokens.Code, lineIndex);
         continue;
      }

      if (block.type === "list") {
         lineIndex = handleList(block as Tokens.List, lineIndex);
         continue;
      }

      if ("tokens" in block && block.tokens) {
         lineIndex = walk(block.tokens, lineIndex, 0);
      }

      lineIndex += 1;
   }

   return ranges;
}

export function getCodeLanguage(language: string) {
   switch (language) {
      case "javascript":
      case "js":
         return "javascript";
      case "typescript":
      case "ts":
         return "typescript";
      case "python":
      case "py":
         return "python";
      case "csharp":
      case "c#":
         return "csharp";
      case "cpp":
      case "c++":
         return "c++";
      case "md":
         return "md";
      default:
         return "md";
   }
}

function tokenizeHighlightJS(code: string, language: string): Array<MarkedCodeToken> {
   const highlighted = hljs.highlight(code, { language }).value;

   const parser = new DOMParser();
   const doc = parser.parseFromString(highlighted, "text/html");

   const ranges: Array<MarkedCodeToken> = code.split("\n").map((line, index) => ({ line: index, start: -1, end: -1, types: [], text: "" }));
   // const ranges: Array<MarkedCodeToken> = [];
   let line = 0;
   let offset = 0;

   function walk(node: Node, activeTypes: string[]) {
      if (node.nodeType === Node.TEXT_NODE) {
         const parts = (node as Text).textContent.split("\n");
         for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.length > 0) {
               ranges.push({
                  line,
                  start: offset,
                  end: offset + part.length,
                  text: part,
                  // hljs class names like "hljs-keyword", "hljs-string" etc.
                  types: [...activeTypes],
               });

               offset += part.length;
            }

            if (i < parts.length - 1) {
               line += 1;
               offset = 0;
            }
         }
         return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
         // Extract the token type from the class e.g. "hljs-keyword" → "keyword"
         const cls = [...(node as HTMLElement).classList].find((c) => c.startsWith("hljs-"));

         const nextTypes = cls ? [...activeTypes, cls] : activeTypes;

         for (const child of node.childNodes) {
            walk(child, nextTypes);
         }
         return;
      }
   }

   walk(doc.body, []);

   return ranges;
}
