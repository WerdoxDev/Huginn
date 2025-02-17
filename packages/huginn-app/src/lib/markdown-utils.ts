import type { HuginnToken } from "@/types";
import { clamp } from "@huginn/shared";
import type Token from "markdown-it/lib/token.mjs";

export function hasMarkup(markup: string) {
	return markup && markup !== "linkify";
}

export function getTokenLength(token: HuginnToken) {
	return (
		(token.markup === "autolink" ? 1 : token.markup !== "linkify" ? token.markup.length : 0) +
		(token.type === "link_open" ? (token.attrs?.[0]?.[1].length ?? 0) : !token.type.includes("fence") ? token.content.length : 0)
	);
}

export function isOpenToken(token: HuginnToken) {
	return token.type.includes("open");
}

export function isCloseToken(token: HuginnToken) {
	return token.type.includes("close");
}

export function isElementOpenToken(token: HuginnToken) {
	return ["link_open", "spoiler_open", "fence_open"].includes(token.type);
}

export function isElementCloseToken(token: HuginnToken) {
	return ["link_close", "spoiler_close", "fence_close"].includes(token.type);
}

export function getSlateFormats(openedTokens: HuginnToken[]) {
	return {
		bold: openedTokens.some((x) => x?.type === "strong_open"),
		italic: openedTokens.some((x) => x?.type === "em_open"),
		underline: openedTokens.some((x) => x?.type === "underline_open"),
		spoiler: openedTokens.some((x) => x?.type === "spoiler_open"),
		link: openedTokens.some((x) => x?.type === "link_open"),
	};
}

export function organizeTokens(tokens: Token[]) {
	const lines: HuginnToken[][] = [];
	let currentLine: HuginnToken[] = [];

	let lastParagraphEnd = 0;

	for (const token of tokens) {
		// Skip paragraph delimiters, as they do not contribute to actual content lines
		if (token.type === "paragraph_close") {
			if (currentLine.length) {
				lines.push(currentLine);
				currentLine = [];
			}
		}

		if (token.type === "paragraph_open" || token.type === "fence") {
			// Push the remaining content from last line

			// Calculate space between this line and last one
			const currentParagraphStart = token.map?.[0] ?? 0;
			for (let i = 0; i < currentParagraphStart - lastParagraphEnd; i++) {
				lines.push([]);
			}

			lastParagraphEnd = token.map?.[1] ?? 0;
		}

		if (token.type === "fence" && token.map) {
			lines.push([{ content: token.content, type: "fence_open", info: token.info, markup: token.markup, map: token.map, attrs: token.attrs }]);
			const numberOfNewLines = (token.content.match(/\n/g) ?? []).length;
			const hasHangingNewLine = token.content.lastIndexOf("\n") + 1 === token.content.length;
			const contentLength = hasHangingNewLine ? numberOfNewLines : token.content !== "" ? numberOfNewLines + 1 : 0;

			for (let i = 0; i < contentLength; i++) {
				lines.push([{ content: token.content, markup: token.markup, type: token.type, info: token.info, map: token.map, attrs: token.attrs }]);
			}

			if (hasHangingNewLine) {
				lines.push([{ content: token.content, type: "fence_close", info: token.info, markup: token.markup, map: token.map, attrs: token.attrs }]);
			}
		}

		if (token.type === "inline") {
			// Process inline tokens
			const inlineTokens = token.children || [];
			for (const inlineToken of inlineTokens) {
				if (inlineToken.type === "softbreak" || inlineToken.type === "hardbreak") {
					// Push the current line and start a new line
					lines.push(currentLine);
					currentLine = [];
				} else {
					// Add inline tokens to the current line
					currentLine.push({
						type: inlineToken.type,
						content: inlineToken.content,
						markup: inlineToken.markup,
						info: inlineToken.info,
						attrs: inlineToken.attrs,
						map: null,
					});
				}
			}
		}
	}

	// Push any remaining tokens in the current line
	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	return lines;
}

export function splitHighlightedTokens(tokens: Array<{ type: string; content: string | null }>) {
	const result: Array<{ type: string; content: string | null }> = [];

	for (const token of tokens) {
		if (token.content?.includes("\n")) {
			// Split the content by newline and map each part to a new token
			const splitContent = token.content.split("\n");
			splitContent.forEach((line, index) => {
				// Push each line as a separate token, preserving the type
				if (line !== "") {
					result.push({
						content: line,
						type: token.type,
					});
				}

				// Add a newline token after all lines except the last
				if (index < splitContent.length - 1) {
					result.push({
						content: "\n",
						type: token.type, // You can adjust the type as needed
					});
				}
			});
		} else if (token.content !== "") {
			// If no newline, add the token as-is
			result.push(token);
		}
	}

	return result;
}

export function getHighlightedLineTokens(tokens: Array<{ type: string; content: string | null }>, lineIndex: number) {
	const lineTokens: Array<{ type: string; content: string | null }> = [];
	let currentLineIndex = 0;

	for (const token of tokens) {
		if (token.content === "\n") {
			// Increment the line index when encountering a newline token
			currentLineIndex++;
		} else if (currentLineIndex === lineIndex) {
			// Collect tokens for the target line index
			lineTokens.push(token);
		} else if (currentLineIndex > lineIndex) {
			// Break early if we've passed the target line
			break;
		}
	}

	return lineTokens;
}

export function getCodeLanguage(language: string) {
	switch (language) {
		case "js":
			return "javascript";
		case "ts":
			return "typescript";
		case "csharp":
			return "csharp";
		case "c#":
			return "csharp";
		case "cpp":
			return "c++";
		case "c++":
			return "c++";
		case "md":
			return "md";
		default:
			return undefined;
	}
}
