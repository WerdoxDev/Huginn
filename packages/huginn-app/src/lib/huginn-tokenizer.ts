type TokenType = "bold" | "italic" | "underline" | "spoiler";

type Token = {
	type: TokenType;
	fullText: string;
	content: string;
	start: number;
	end: number;
	mark?: string;
};

type Group = { type: TokenType; groups: { startMark: string; content: string; endMark: string } };

const groups: Group[] = [
	{ type: "bold", groups: { startMark: "msb", content: "cb", endMark: "meb" } },
	{ type: "italic", groups: { startMark: "msi", content: "ci", endMark: "mei" } },
	{ type: "underline", groups: { startMark: "msu", content: "cu", endMark: "meu" } },
	{ type: "spoiler", groups: { startMark: "mss", content: "cs", endMark: "mes" } },
];

export function tokenize(text: string) {
	const tokens: Token[] = [];

	const patterns: RegExp[] = [
		/(?<msi>_(?!_))(?<ci>[\p{L}]*[^_])(?<mei>_(?!_))|(?<msu>__)(?<cu>[\p{L}]+?)(?<meu>__)/gu,
		/(?<msi>\*(?!\*))(?<ci>[\p{L}]*[^\*])(?<mei>\*(?!\*))|(?<msb>\*\*)(?<cb>[\p{L}]+?)(?<meb>\*\*)/gu,
		/(?<mss>\|\|)(?<cs>[\p{L}]+?)(?<mes>\|\|)/gu,
	];

	for (const pattern of patterns) {
		let match: RegExpExecArray | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		while ((match = pattern.exec(text)) !== null) {
			const groupKeys = Object.keys(match.groups || {}).filter((x) => match?.groups?.[x]);
			for (const group of groups.filter((x) => Object.values(x.groups).some((y) => groupKeys.includes(y)))) {
				const fullMatch = match[0];
				const start = match.index;
				const end = start + (fullMatch.length - 1);
				const content = match.groups?.[group.groups.content];
				const startMarkers = match.groups?.[group.groups.startMark];

				//end > start, start >
				if (tokens.filter((x) => x.start === start || x.end === start || x.end === end).length === 0) {
					tokens.push({
						type: group.type,
						fullText: text.slice(start, end + 1),
						content: content || "",
						start: start,
						end: end,
						mark: startMarkers,
					});
				}
			}
		}
	}

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (tokens.filter((x) => x.end > token.start && token.start > x.start).length > 0) {
			tokens.splice(i, 1);
		}
	}

	return tokens;
}
