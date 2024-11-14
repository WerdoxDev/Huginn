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

const tokenTypes: Record<string, TokenTypeFlag> = {
	threes: TokenTypeFlag.BOLD | TokenTypeFlag.ITALIC,
	ones: TokenTypeFlag.ITALIC,
	twos: TokenTypeFlag.BOLD,
	oneu: TokenTypeFlag.ITALIC,
	twou: TokenTypeFlag.UNDERLINE,
	threeu: TokenTypeFlag.UNDERLINE | TokenTypeFlag.ITALIC,
	twol: TokenTypeFlag.SPOILER,
};

const cache = new Map<string, FinishedToken[]>();

export function tokenize(text: string) {
	if (cache.has(text)) {
		return cache.get(text);
	}

	const tokens: FinishedToken[] = [];

	let match: RegExpExecArray | null;
	const pattern = /(?<threes>(\*\*\*))|(?<twos>(\*\*))|(?<ones>(\*))|(?<threeu>(\_\_\_))|(?<twou>(\_\_))|(?<oneu>(\_))|(?<twol>(\|\|))/g;

	const unfinishedTokens: { start?: Token; end?: Token; type: TokenTypeFlag }[] = [];
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

	cache.set(text, tokens);

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
