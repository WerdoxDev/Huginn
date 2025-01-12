import type Token from "markdown-it/lib/token.mjs";

export function hasMarkup(markup: string) {
	return markup && markup !== "linkify";
}

export function getMarkupLength(markup: string) {
	return markup === "autolink" ? 1 : markup !== "linkify" ? markup.length : 0;
}

export function isOpenToken(token: Token) {
	return token.type.includes("open");
}

export function isCloseToken(token: Token) {
	return token.type.includes("close");
}

export function isElementOpenToken(token: Token) {
	return ["link_open", "spoiler_open"].includes(token.type);
}

export function isElementCloseToken(token: Token) {
	return ["link_close", "spoiler_close"].includes(token.type);
}

export function getSlateFormats(openedTokens: Token[]) {
	return {
		bold: openedTokens.some((x) => x?.type === "strong_open"),
		italic: openedTokens.some((x) => x?.type === "em_open"),
		underline: openedTokens.some((x) => x?.type === "underline_open"),
		spoiler: openedTokens.some((x) => x?.type === "spoiler_open"),
		link: openedTokens.some((x) => x?.type === "link_open"),
	};
}
