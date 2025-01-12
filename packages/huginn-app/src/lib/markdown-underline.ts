import type MarkdownIt from "markdown-it";

export function markdownUnderline(md: MarkdownIt) {
	// Modify the token parsing rules to change the delimiter for underlining
	md.inline.ruler.before("emphasis", "underline", (state, silent) => {
		const start = state.pos;
		const max = state.posMax;

		// Check if we have at least two underscores
		if (start + 1 >= max || state.src[start] !== "_" || state.src[start + 1] !== "_") {
			return false;
		}

		// Determine the number of underscores
		let markerCount = 0;
		while (start + markerCount < max && state.src[start + markerCount] === "_") {
			markerCount++;
		}

		if (markerCount < 2) return false; // Not enough underscores for underline

		const marker = "_".repeat(markerCount);
		state.pos = start + markerCount;

		// Find the closing marker
		const contentStart = state.pos;
		while (state.pos < max) {
			let closeMarkerCount = 0;
			while (state.pos + closeMarkerCount < max && state.src[state.pos + closeMarkerCount] === "_") {
				closeMarkerCount++;
			}

			if (closeMarkerCount === markerCount && state.pos > contentStart) {
				if (!silent) {
					// Handle the underline or underline + italic
					if (markerCount === 3) {
						// Create separate underline and italic tokens
						const tokenUOpen = state.push("underline_open", "u", 1);
						tokenUOpen.markup = "__";

						const tokenEmOpen = state.push("em_open", "em", 1);
						tokenEmOpen.markup = "_";

						// Parse the inner content as nested markdown
						state.md.inline.parse(state.src.slice(contentStart, state.pos), state.md, state.env, state.tokens);

						const tokenEmClose = state.push("em_close", "em", -1);
						tokenEmClose.markup = "_";

						const tokenUClose = state.push("underline_close", "u", -1);
						tokenUClose.markup = "__";
					} else if (markerCount === 2) {
						// Underline only
						const tokenUOpen = state.push("underline_open", "u", 1);
						tokenUOpen.markup = marker;

						// Parse the inner content as nested markdown
						state.md.inline.parse(state.src.slice(contentStart, state.pos), state.md, state.env, state.tokens);

						const tokenUClose = state.push("underline_close", "u", -1);
						tokenUClose.markup = marker;
					}
				}

				// Move past the closing marker
				state.pos += closeMarkerCount;
				return true;
			}

			state.pos++;
		}

		// Reset position if no closing marker is found
		state.pos = start;
		return false;
	});
}
