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
	const patterns = [
		/(?<threes>(\*\*\*))/g,
		/(?<twos>(\*\*))/g,
		/(?<ones>(\*))/g,
		/(?<threeu>(\_\_\_))/g,
		/(?<twou>(\_\_))/g,
		/(?<oneu>(\_))/g,
		/(?<twol>(\|\|))/g,
		/(?<link>https?:\/\/[^\s/$.?#].[^\s]*)/g,
	];

	const unfinishedTokens: { start?: Token; end?: Token; type: TokenTypeFlag }[] = [];
	for (const pattern of patterns) {
		// console.log(pattern);
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		while ((match = pattern.exec(text)) !== null) {
			// for (const [group, type] of Object.entries(tokenTypes)) {
			const type = tokenTypes[Object.keys(match.groups ?? {})[0]];
			if (!type) {
				continue;
			}
			// if (match.groups?.[group]) {
			// console.log([...tokens], match.index, match[0].length, match.groups);
			if (
				tokens.some(
					(x) =>
						((match?.index ?? 0) >= x.start && (match?.index ?? 0) <= x.start + (x.mark?.length ?? 0) - 1) ||
						((match?.index ?? 0) <= x.end && (match?.index ?? 0) >= x.end - (x.mark?.length ?? 0) + 1),
				)
			) {
				continue;
			}

			const unfinishedTokenIndex = unfinishedTokens.findIndex((x) => x.type === type);

			let token = unfinishedTokens[unfinishedTokenIndex];
			if (hasFlag(type, TokenTypeFlag.LINK)) {
				const endIndex = match.index + match[0].length;
				const interferingToken = tokens.find((x) => x.end === endIndex - 1);
				token = {
					start: { index: match.index, text: "" },
					end: { index: endIndex - (interferingToken?.mark?.length ?? 0), text: "" },
					type: type,
				};
			}

			// Token does not exist
			if (!token) {
				unfinishedTokens.push({ start: { index: match.index, text: match[0] }, type: type });
			} else if (token && !token.end) {
				token.end = { index: match.index, text: match[0] };
			}

			// Check token is complete
			if (token?.start && token?.end) {
				const content = text.slice(token.start.index + token.start.text.length, token.end.index);
				if (content) {
					tokens.push({
						start: token.start.index,
						content,
						end: token.end.index + token.end.text.length - 1,
						type: getTokenTypeFromFlag(token.type),
						mark: token.start.text,
					});
				}

				if (!content) {
					unfinishedTokens.push({ start: token.end, type: token.type });
				}

				if (unfinishedTokenIndex !== -1) {
					unfinishedTokens.splice(unfinishedTokenIndex, 1);
				}
			}
		}

		unfinishedTokens.splice(0, unfinishedTokens.length);
	}

	// Aftermath
	for (const linkToken of tokens.filter((x) => x.type.includes("link"))) {
		const interferingTokenIndex = tokens.findIndex((x) => x.start > linkToken.start && x.end < linkToken.end);

		if (interferingTokenIndex !== -1) {
			tokens.splice(interferingTokenIndex, 1);
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

	// console.log(mergedTokens);

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
