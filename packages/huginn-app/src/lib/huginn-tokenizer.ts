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
	startMark?: string;
	endMark?: string;
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
	if (caches.has(text)) {
		const cache = caches.get(text);
		if (cache?.tokens && arrayEqual(cache?.skippedTokens, skipTokens)) {
			return cache?.tokens;
		}
	}

	let _text = text;

	const tokens: FinishedToken[] = [];

	let match: RegExpExecArray | null;
	const patterns = [
		/(?<link>https?:\/\/[^\s/$.?#].[^\s]*(?<![\)\|]))/g,
		/(?<threes>(\*\*\*))/g,
		/(?<twos>(\*\*))/g,
		/(?<ones>(\*))/g,
		/(?<threeu>(\_\_\_))/g,
		/(?<twou>(\_\_))/g,
		/(?<oneu>(\_))/g,
		/(?<twol>(\|\|))/g,
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

			const unfinishedTokenIndex = unfinishedTokens.findIndex((x) => x.type === type);
			let unfinishedToken = unfinishedTokens[unfinishedTokenIndex];

			// shift the content of a link token because a markdown can be otherwise created
			const linkToken = tokens.find((x) => x.types.includes("link") && x.end === (match?.index ?? 0) + (match?.[0].length ?? 0) - 1);
			if (linkToken && unfinishedToken) {
				linkToken.end -= match[0].length;
				linkToken.content = linkToken.content.slice(0, linkToken.content.length - match[0].length);
			}

			if (
				tokens.some((x) => {
					const index = match?.index ?? 0;
					return (
						(index >= x.start && index <= x.start + (x.startMark?.length ?? 0) - 1) ||
						(index <= x.end && index >= x.end - (x.startMark?.length ?? 0) + 1) ||
						(x.types.includes("link") && index > x.start && index < x.end)
					);
				})
			) {
				continue;
			}

			if (hasFlag(type, TokenTypeFlag.LINK)) {
				const endIndex = match.index + match[0].length;
				const interferingToken = tokens.find((x) => x.end === endIndex - 1);
				unfinishedToken = {
					start: { index: match.index, text: "" },
					end: { index: endIndex - (interferingToken?.startMark?.length ?? 0), text: "" },
					type: type,
				};
			} else if (hasFlag(type, TokenTypeFlag.MASK_LINK) && match.groups) {
				// // const contentTokens = tokenize(match.groups.mask_content);
				// // console.log(match.index);
				// // const combinedText = contentTokens.map((x) => x.content).join();
				// // for (const contentToken of contentTokens) {
				// // 	tokens.push({
				// // 		start: contentToken.start + offset,
				// // 		end: contentToken.end + offset,
				// // 		content: contentToken.content,
				// // 		types: ["mask_link", ...contentToken.types],
				// // 		startMark: contentToken.startMark,
				// // 		endMark: contentToken.endMark,
				// // 	});
				// // }
				// const start = match.index + 1; // +1 because ->[text](link)
				// const end = match.index + 1 + match.groups.mask_content.length - 1;
				// const contentTokens = tokens.filter((x) => x.start === start || x.end === end).toSorted((a, b) => a.start - b.start);
				// for (const contentToken of contentTokens) {
				// 	contentToken.start -= 1;
				// 	contentToken.end -= 1;
				// 	contentToken.types.push("mask_link");
				// }
				// _text = removeSlice(_text, match.index, match.index + match[0].length, contentTokens.map((x) => x.content).join());
				// // pattern.lastIndex = match.index + combinedText.length - 1;
				// continue;
			}

			// Token does not exist
			if (!unfinishedToken) {
				unfinishedTokens.push({ start: { index: match.index, text: match[0] }, type: type });
			} else if (unfinishedToken && !unfinishedToken.end) {
				unfinishedToken.end = { index: match.index, text: match[0] };
			}

			// Check token is complete
			if (unfinishedToken?.start && unfinishedToken?.end) {
				const content = _text.slice(unfinishedToken.start.index + unfinishedToken.start.text.length, unfinishedToken.end.index);
				if (content) {
					tokens.push({
						start: unfinishedToken.start.index,
						content,
						end: unfinishedToken.end.index + unfinishedToken.end.text.length - 1,
						types: getTokenTypeFromFlag(unfinishedToken.type),
						startMark: unfinishedToken.start.text,
						endMark: unfinishedToken.end.text,
					});
				}

				if (!content) {
					unfinishedTokens.push({ start: unfinishedToken.end, type: unfinishedToken.type });
				}

				if (unfinishedTokenIndex !== -1) {
					unfinishedTokens.splice(unfinishedTokenIndex, 1);
				}
			}
		} while (match);

		unfinishedTokens.splice(0, unfinishedTokens.length);
	}

	// add all text as a single token because no token was created
	if (tokens.length === 0 && text) {
		tokens.push({ start: 0, end: _text.length - 1, content: _text, types: [] });
	}
	// add all of other non tokenized texts
	else if (text) {
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

	tokens.sort((a, b) => a.start - b.start);

	// console.log([...tokens]);

	// separate tokens into a left-to-right appendable form
	const copiedTokens = [...tokens];
	const indeciesToRemove: number[] = [];
	for (const [i, token] of copiedTokens.entries()) {
		const memberTokens = copiedTokens.filter(
			(x) =>
				x.start > token.start &&
				x.end < token.end &&
				// Ensure no other x fully contains this one within the same range
				!copiedTokens.some((other) => other.start < x.start && other.end > x.end && other.start > token.start && other.end < token.end),
		);
		if (memberTokens.length === 0) {
			continue;
		}

		for (const [i, memberToken] of memberTokens.entries()) {
			const maximumEnd = i === memberTokens.length - 1 ? token.end : memberTokens[i + 1].start - 1;
			const minimumStart = i === 0 ? token.start : memberTokens[i - 1].end + 1;

			if (minimumStart === token.start) {
				// add prefix token
				tokens.push({
					start: minimumStart,
					end: memberToken.start - 1,
					content: _text.slice(minimumStart + (token.startMark?.length ?? 0), memberToken.start),
					startMark: token.startMark,
					types: token.types,
				});
			}

			if (maximumEnd === token.end) {
				// add suffix token
				tokens.push({
					start: memberToken.end + 1,
					end: maximumEnd,
					content: _text.slice(memberToken.end + 1, maximumEnd - (token.endMark?.length ?? 0) + 1),
					endMark: token.endMark,
					types: token.types,
				});
			}

			if (maximumEnd !== token.end) {
				tokens.push({
					start: memberToken.end + 1,
					end: maximumEnd,
					content: _text.slice(memberToken.end + 1, maximumEnd + 1),
					types: token.types,
				});
			}

			memberToken.types.push(...token.types);
		}

		indeciesToRemove.push(i);
	}

	// Remove indecies based on a higher first approach
	for (const index of indeciesToRemove.toSorted((a, b) => b - a)) {
		tokens.splice(index, 1);
	}

	tokens.sort((a, b) => a.start - b.start);
	caches.set(text, { tokens: tokens, skippedTokens: skipTokens });

	// console.log(tokens);

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
				content: currentToken.content.replaceAll(token.startMark ?? "", ""),
				start: currentToken.start,
				end: currentToken.end,
				types: [...currentToken.types, ...token.types],
				startMark: (currentToken.startMark ?? "") + (token.startMark ?? ""),
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
