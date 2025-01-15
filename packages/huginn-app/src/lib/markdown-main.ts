import type MarkdownIt from "markdown-it";

export function markdownMainEditor(md: MarkdownIt) {
	md.core.ruler.enableOnly(["inline", "block", "normalize"]);
	md.block.ruler.enableOnly(["paragraph", "fence"]);
	md.inline.ruler.enableOnly(["spoiler", "emphasis", "underline", "newline", "linkify", "escape", "autolink"]);
	md.inline.ruler2.enableOnly(["spoiler", "emphasis", "balance_pairs"]);
}

export function markdownMainMessage(md: MarkdownIt) {
	md.core.ruler.enableOnly(["inline", "block", "normalize"]);
	md.block.ruler.enableOnly(["paragraph", "fence"]);
	md.inline.ruler.enableOnly(["spoiler", "emphasis", "underline", "newline", "linkify", "escape", "link", "autolink"]);
	md.inline.ruler2.enableOnly(["spoiler", "emphasis", "balance_pairs"]);
}
