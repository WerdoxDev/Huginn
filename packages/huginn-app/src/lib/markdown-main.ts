import type MarkdownIt from "markdown-it";

export function markdownMainEditor(md: MarkdownIt) {
   md.core.ruler.push("fix_spaced_emphasis", (state) => {
      state.src = state.src.replace(/(\*\*|__)\s+(.+?)\s+(\*\*|__)/g, "$1$2$3").replace(/(\*|_)\s+(.+?)\s+(\*|_)/g, "$1$2$3");
   });
   md.core.ruler.enableOnly(["fix_spaced_emphasis", "inline", "block", "normalize"]);
   md.block.ruler.enableOnly(["paragraph", "fence"]);
   md.inline.ruler.enableOnly(["spoiler", "emphasis", "underline", "newline", "linkify", "escape", "autolink", "backticks"]);
   md.inline.ruler2.enableOnly(["emphasis", "balance_pairs"]);
}

export function markdownMainMessage(md: MarkdownIt) {
   md.core.ruler.enableOnly(["inline", "block", "normalize"]);
   md.block.ruler.enableOnly(["paragraph", "fence"]);
   // console.log(md.inline.ruler.getRules(""), md.inline.ruler2.getRules(""));
   md.inline.ruler.enableOnly(["spoiler", "emphasis", "underline", "newline", "linkify", "escape", "link", "autolink", "backticks"]);
   md.inline.ruler2.enableOnly(["emphasis", "balance_pairs"]);
}
