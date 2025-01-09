import { arrayEqual, hasFlag } from "@huginn/shared";

export type TokenType = "bold" | "italic" | "underline" | "spoiler" | "link" | "mask_link";

export enum TokenTypeFlag {
	NONE = 0,
	BOLD = 1 << 0,
	ITALIC = 1 << 1,
	UNDERLINE = 1 << 2,
	SPOILER = 1 << 3,
	LINK = 1 << 4,
	MASK_LINK = 1 << 5,
}

export type FinishedToken = {
	types: TokenType[];
	content: string;
	start: number;
	end: number;
	data?: { url?: string };
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
	mask: TokenTypeFlag.MASK_LINK,
};

const caches = new Map<string, { tokens: FinishedToken[]; skippedTokens?: TokenType[] }>();

export function tokenize(text: string, skipTokens?: TokenType[]) {
	//TODO: Cache is disabled because exclusions are not being taken into account
	if (caches.has(text)) {
		const cache = caches.get(text);
		if (cache?.tokens && arrayEqual(cache?.skippedTokens, skipTokens)) {
			return cache?.tokens;
		}
	}

	console.log("NO CACHE");

	let _text = text;

	const tokens: FinishedToken[] = [];

	let match: RegExpExecArray | null;
	const patterns = [
		/(?<mask>\[(?<mask_content>[^\]]+)\]\((?<mask_link>https?:\/\/[^\s/$.?#].[^\s]*(?<![\)\|]))\))/g,
		/(?<threes>(\*\*\*))/g,
		/(?<twos>(\*\*))/g,
		/(?<ones>(\*))/g,
		/(?<threeu>(\_\_\_))/g,
		/(?<twou>(\_\_))/g,
		/(?<oneu>(\_))/g,
		/(?<twol>(\|\|))/g,
		/(?<link>https?:\/\/[^\s/$.?#].[^\s]*(?<![\)\|]))/g,
	];

	const unfinishedTokens: Array<{ start?: Token; end?: Token; type: TokenTypeFlag }> = [];
	for (const pattern of patterns) {
		do {
			match = pattern.exec(_text);
			if (!match) {
				continue;
			}

			const type = tokenTypes[Object.keys(match.groups ?? {})[0]];
			if (!type) {
				continue;
			}

			if (skipTokens?.some((x) => getTokenFlagFromType(x) === type)) {
				continue;
			}
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
			} else if (hasFlag(type, TokenTypeFlag.MASK_LINK) && match.groups) {
				tokens.push({
					start: match.index,
					end: match.index + match.groups.mask_content.length - 1,
					content: match.groups.mask_content,
					data: { url: match.groups.mask_link },
					types: ["mask_link"],
				});
				_text = removeSlice(_text, match.index, match.index + match[0].length, match.groups.mask_content);
				pattern.lastIndex = match.index + match.groups.mask_content.length - 1;
				continue;
			}

			// Token does not exist
			if (!token) {
				unfinishedTokens.push({ start: { index: match.index, text: match[0] }, type: type });
			} else if (token && !token.end) {
				token.end = { index: match.index, text: match[0] };
			}

			// Check token is complete
			if (token?.start && token?.end) {
				const content = _text.slice(token.start.index + token.start.text.length, token.end.index);
				if (content) {
					tokens.push({
						start: token.start.index,
						content,
						end: token.end.index + token.end.text.length - 1,
						types: getTokenTypeFromFlag(token.type),
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
		} while (match);

		unfinishedTokens.splice(0, unfinishedTokens.length);
	}

	// Aftermath
	for (const linkToken of tokens.filter((x) => x.types.includes("link"))) {
		const interferingTokenIndex = tokens.findIndex((x) => x.start > linkToken.start && x.end < linkToken.end);

		if (interferingTokenIndex !== -1) {
			tokens.splice(interferingTokenIndex, 1);
		}
	}

	// add all text as a single token because no token was created
	if (tokens.length === 0) {
		tokens.push({ start: 0, end: _text.length - 1, content: _text, types: [] });
	} else {
		let lastTokenEnd = undefined;
		for (const token of tokens.toSorted((a, b) => a.start - b.start)) {
			// if(lastTokenEnd && token.start <)
			// if this is not the first token and the last saved position is not directly before this token. so there is atleast a 1 character gap
			if (lastTokenEnd && token.start > lastTokenEnd + 1) {
				tokens.push({ start: lastTokenEnd + 1, end: token.start - 1, content: _text.slice(lastTokenEnd + 1, token.start), types: [] });
			}
			// if this is the first token and it doesn't start from 0, add the text before it
			else if (!lastTokenEnd && token.start !== 0) {
				tokens.push({ start: 0, end: token.start - 1, content: _text.slice(0, token.start), types: [] });
			}

			if (token.end > (lastTokenEnd ?? 0)) {
				lastTokenEnd = token.end;
			}
		}
		// add the remaining end section of the text
		if (lastTokenEnd && lastTokenEnd !== _text.length - 1) {
			tokens.push({ start: lastTokenEnd + 1, end: _text.length - 1, content: _text.slice(lastTokenEnd + 1), types: [] });
		}
	}
	console.log([...tokens]);

	caches.set(text, { tokens: tokens, skippedTokens: skipTokens });

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
				types: [...currentToken.types, ...token.types],
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

function removeSlice(text: string, start: number, end: number, replacement: string) {
	return text.slice(0, start) + replacement + text.slice(end);
}

function getTokenTypeFromFlag(flag: TokenTypeFlag): TokenType[] {
	const finalTokens: TokenType[] = [];

	if (hasFlag(flag, TokenTypeFlag.BOLD)) finalTokens.push("bold");
	if (hasFlag(flag, TokenTypeFlag.ITALIC)) finalTokens.push("italic");
	if (hasFlag(flag, TokenTypeFlag.UNDERLINE)) finalTokens.push("underline");
	if (hasFlag(flag, TokenTypeFlag.SPOILER)) finalTokens.push("spoiler");
	if (hasFlag(flag, TokenTypeFlag.LINK)) finalTokens.push("link");
	if (hasFlag(flag, TokenTypeFlag.MASK_LINK)) finalTokens.push("mask_link");

	return finalTokens;
}

function getTokenFlagFromType(type: TokenType): TokenTypeFlag {
	if (type === "mask_link") return TokenTypeFlag.MASK_LINK;
	return 0;
}
