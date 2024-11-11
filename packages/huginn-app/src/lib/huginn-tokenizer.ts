import { hasFlag } from "@huginn/shared";

type TokenType = "bold" | "italic" | "underline" | "spoiler";

export enum TokenTypeFlag {
	NONE = 0,
	BOLD = 1 << 0,
	ITALIC = 1 << 1,
	UNDERLINE = 1 << 2,
	SPOILER = 1 << 3,
}

type FinishedToken = {
	type: TokenType[];
	content: string;
	start: number;
	end: number;
	mark?: string;
};

type Group = { type: TokenTypeFlag; groups: { startMark: string; content: string; endMark: string } };

// const groups: Group[] = [
// 	{ type: "bold", groups: { startMark: "msb", content: "cb", endMark: "meb" } },
// 	{ type: "italic", groups: { startMark: "msi", content: "ci", endMark: "mei" } },
// 	{ type: "underline", groups: { startMark: "msu", content: "cu", endMark: "meu" } },
// 	{ type: "spoiler", groups: { startMark: "mss", content: "cs", endMark: "mes" } },
// ];

export function tokenize(text: string) {
	// newTokenize(text);
	const tokens: FinishedToken[] = [];

	// const patterns: RegExp[] = [
	// 	/(?<msi>_(?!_))(?<ci>[^_]*)(?<mei>_(?!_))|(?<msu>__)(?<cu>.+?)(?<meu>__)/gu,
	// 	/(?<msi>\*(?!\*))(?<ci>[^\*]*)(?<mei>\*(?!\*))|(?<msu>\*\*)(?<cu>.+?)(?<meu>\*\*)/gu,
	// 	/(?<mss>\|\|)(?<cs>[^\|]+?)(?<mes>\|\|)/gu,
	// ];

	// for (const pattern of patterns) {
	// 	let match: RegExpExecArray | null;
	// 	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	// 	while ((match = pattern.exec(text)) !== null) {
	// 		const groupKeys = Object.keys(match.groups || {}).filter((x) => match?.groups?.[x]);
	// 		for (const group of groups.filter((x) => Object.values(x.groups).some((y) => groupKeys.includes(y)))) {
	// 			const fullMatch = match[0];
	// 			const start = match.index;
	// 			const end = start + (fullMatch.length - 1);
	// 			const content = match.groups?.[group.groups.content];
	// 			const startMarkers = match.groups?.[group.groups.startMark];

	// 			//end > start, start >
	// 			if (tokens.filter((x) => x.start === start || x.end === start || x.end === end).length === 0) {
	// 				tokens.push({
	// 					type: group.type,
	// 					fullText: text.slice(start, end + 1),
	// 					content: content || "",
	// 					start: start,
	// 					end: end,
	// 					mark: startMarkers,
	// 				});
	// 			}
	// 		}
	// 	}
	// }

	// for (let i = 0; i < tokens.length; i++) {
	// 	const token = tokens[i];
	// 	if (tokens.filter((x) => x.end > token.start && token.start > x.start).length > 0) {
	// 		tokens.splice(i, 1);
	// 	}
	// }
	let match: RegExpExecArray | null;
	const pattern = /(?<threes>(\*\*\*))|(?<twos>(\*\*))|(?<ones>(\*))|(?<twou>(\_\_))|(?<oneu>(\_))/g;

	const tokenTypes: Record<string, TokenTypeFlag> = {
		threes: TokenTypeFlag.BOLD | TokenTypeFlag.ITALIC,
		ones: TokenTypeFlag.ITALIC,
		twos: TokenTypeFlag.BOLD,
		oneu: TokenTypeFlag.ITALIC,
		twou: TokenTypeFlag.UNDERLINE,
		twol: TokenTypeFlag.SPOILER,
	};
	const unfinishedTokens: { start?: Token; end?: Token; type: TokenTypeFlag }[] = [];
	let start: Token | undefined;
	let content: Token | undefined;
	let end: Token | undefined;
	// **test**
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	while ((match = pattern.exec(text)) !== null) {
		for (const [group, type] of Object.entries(tokenTypes)) {
			if (match.groups?.[group]) {
				const unfinishedTokenIndex = unfinishedTokens.findIndex((x) => x.type === type);
				const unfinishedToken = unfinishedTokens[unfinishedTokenIndex];

				if (!unfinishedToken) {
					unfinishedTokens.push({ start: { index: match.index, text: match[0] }, type: type });
				} else if (unfinishedToken && !unfinishedToken.end) {
					unfinishedToken.end = { index: match.index, text: match[0] };
				}

				if (unfinishedToken?.start && unfinishedToken?.end) {
					const content = text.slice(unfinishedToken.start.index + unfinishedToken.start.text.length, unfinishedToken.end.index);
					tokens.push({
						start: unfinishedToken.start.index,
						content,
						end: unfinishedToken.end.index + unfinishedToken.end.text.length - 1,
						type: getTokenTypeFromFlag(unfinishedToken.type),
						mark: unfinishedToken.start.text,
					});

					unfinishedTokens.splice(unfinishedTokenIndex, 1);
				}
			}
		}
	}

	console.log(tokens);

	return tokens;
}

function getTokenTypeFromFlag(flag: TokenTypeFlag): TokenType[] {
	const finalTokens: TokenType[] = [];

	if (hasFlag(flag, TokenTypeFlag.BOLD)) finalTokens.push("bold");
	if (hasFlag(flag, TokenTypeFlag.ITALIC)) finalTokens.push("italic");
	if (hasFlag(flag, TokenTypeFlag.UNDERLINE)) finalTokens.push("underline");
	if (hasFlag(flag, TokenTypeFlag.SPOILER)) finalTokens.push("spoiler");

	return finalTokens;
}

type Token = { index: number; text: string };
