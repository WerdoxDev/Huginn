import { hasFlag } from "@huginn/shared";

type TokenType = "bold" | "italic" | "underline" | "spoiler" | "link";

export enum TokenTypeFlag {
	NONE = 0,
	BOLD = 1 << 0,
	ITALIC = 1 << 1,
	UNDERLINE = 1 << 2,
	SPOILER = 1 << 3,
	LINK = 1 << 4,
}

export type FinishedToken = {
	type: TokenType[];
	content: string;
	start: number;
	end: number;
	mark?: string;
};

type Token = { index: number; text: string };

const tokenTypes: Record<string, TokenTypeFlag> = {
	threes: TokenTypeFlag.BOLD | TokenTypeFlag.ITALIC,
	ones: TokenTypeFlag.ITALIC,
	twos: TokenTypeFlag.BOLD,
	oneu: TokenTypeFlag.ITALIC,
	twou: TokenTypeFlag.UNDERLINE,
	threeu: TokenTypeFlag.UNDERLINE | TokenTypeFlag.ITALIC,
	twol: TokenTypeFlag.SPOILER,
	link: TokenTypeFlag.LINK,
};

const cache = new Map<string, FinishedToken[]>();

export function tokenize(text: string) {
	if (cache.has(text)) {
		return cache.get(text) as FinishedToken[];
	}

	const tokens: FinishedToken[] = [];

	let match: RegExpExecArray | null;
	const pattern =
		/(?<link>https?:\/\/[^\s/$.?#].[^\s]*)|(?<threes>(\*\*\*))|(?<twos>(\*\*))|(?<ones>(\*))|(?<threeu>(\_\_\_))|(?<twou>(\_\_))|(?<oneu>(\_))|(?<twol>(\|\|))/g;

	const unfinishedTokens: { start?: Token; end?: Token; type: TokenTypeFlag }[] = [];
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	while ((match = pattern.exec(text)) !== null) {
		for (const [group, type] of Object.entries(tokenTypes)) {
			if (match.groups?.[group]) {
				const unfinishedTokenIndex = unfinishedTokens.findIndex((x) => x.type === type);

				let token = unfinishedTokens[unfinishedTokenIndex];
				if (hasFlag(type, TokenTypeFlag.LINK)) {
					token = {
						start: { index: match.index, text: "" },
						end: { index: match.index + match[0].length, text: "" },
						type: type,
					};
				}

				if (!token) {
					unfinishedTokens.push({ start: { index: match.index, text: match[0] }, type: type });
				} else if (token && !token.end) {
					token.end = { index: match.index, text: match[0] };
				}

				if (token?.start && token?.end) {
					const content = text.slice(token.start.index + token.start.text.length, token.end.index);
					tokens.push({
						start: token.start.index,
						content,
						end: token.end.index + token.end.text.length - 1,
						type: getTokenTypeFromFlag(token.type),
						mark: token.start.text,
					});

					if (unfinishedTokenIndex !== -1) {
						unfinishedTokens.splice(unfinishedTokenIndex, 1);
					}
				}
			}
		}
	}

	cache.set(text, tokens);

	return tokens;
}

export function mergeTokens(tokens: FinishedToken[]) {
	tokens.sort((a, b) => a.start - b.start || b.end - a.end);

	const mergedTokens: FinishedToken[] = [];
	let currentToken: FinishedToken | undefined = undefined;
	for (const token of tokens) {
		if (!currentToken) {
			currentToken = token;
		} else if (token.start >= currentToken.start && token.end <= currentToken.end) {
			const mergedToken: FinishedToken = {
				content: currentToken.content.replaceAll(token.mark ?? "", ""),
				start: currentToken.start,
				end: currentToken.end,
				type: [...currentToken.type, ...token.type],
				mark: (currentToken.mark ?? "") + (token.mark ?? ""),
			};
			currentToken = mergedToken;
		} else {
			mergedTokens.push(currentToken);
			currentToken = token;
		}
	}

	if (currentToken) {
		mergedTokens.push(currentToken);
	}

	return mergedTokens;
}

function getTokenTypeFromFlag(flag: TokenTypeFlag): TokenType[] {
	const finalTokens: TokenType[] = [];

	if (hasFlag(flag, TokenTypeFlag.BOLD)) finalTokens.push("bold");
	if (hasFlag(flag, TokenTypeFlag.ITALIC)) finalTokens.push("italic");
	if (hasFlag(flag, TokenTypeFlag.UNDERLINE)) finalTokens.push("underline");
	if (hasFlag(flag, TokenTypeFlag.SPOILER)) finalTokens.push("spoiler");
	if (hasFlag(flag, TokenTypeFlag.LINK)) finalTokens.push("link");

	return finalTokens;
}
