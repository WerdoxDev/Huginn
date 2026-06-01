import type MarkdownIt from "markdown-it";
import type { RuleInline } from "markdown-it/lib/parser_inline.mjs";

const tokenize: RuleInline = (state, silent) => {
   const start = state.pos;
   const src = state.src;

   // Must start with ||
   if (src.charAt(start) !== "|" || src.charAt(start + 1) !== "|") {
      return false;
   }

   // Find the closing ||
   let pos = start + 2;
   let found = -1;
   while (pos < src.length - 1) {
      if (src.charAt(pos) === "|" && src.charAt(pos + 1) === "|") {
         found = pos;
         break;
      }
      pos++;
   }

   if (found === -1) return false; // no closing || found

   if (silent) return true; // signal that we can match without mutating state

   // Emit open tag
   const open = state.push("spoiler_open", "span", 1);
   open.markup = "||";
   open.attrSet("class", "spoiler");

   // Emit the inner content as inline tokens
   const inner = state.push("inline", "", 0);
   inner.content = src.slice(start + 2, found);
   inner.children = [];

   // Emit close tag
   const close = state.push("spoiler_close", "span", -1);
   close.markup = "||";

   state.pos = found + 2;
   return true;
};

export function markdownSpoiler(md: MarkdownIt) {
   md.inline.ruler.before("emphasis", "spoiler", tokenize);
}
