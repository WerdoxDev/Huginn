import type { CodeElement as SlateCodeElement } from "@/index";
import { getCodeLanguage } from "@lib/markdown-utils";
import hljs from "highlight.js";
import { useState, useMemo } from "react";
import type { RenderElementProps } from "slate-react";

export default function CodeElement(props: RenderElementProps) {
	const { code, language } = props.element as SlateCodeElement;
	const [isCopied, setIsCopied] = useState(false);

	const highlighted = useMemo(() => hljs.highlight(code, { language: getCodeLanguage(language ?? "") ?? "md" }), [code]);

	async function copyToClipboard() {
		await navigator.clipboard.writeText(code.lastIndexOf("\n") === code.length - 1 ? code.slice(0, -1) : code);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	}

	return (
		<div {...props.attributes} contentEditable={false} className="relative my-1 rounded-md bg-secondary font-ubuntu">
			{!isCopied ? (
				<IconMingcuteCopy2Fill
					onClick={copyToClipboard}
					className="absolute top-2 right-1.5 size-4 cursor-pointer text-text/30 hover:text-text"
				/>
			) : (
				<IconMingcuteCheckFill className="absolute top-2 right-1.5 size-4 cursor-pointer text-text" />
			)}

			<div
				className="px-2 py-1 pr-10"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{ __html: highlighted.value }}
			/>
		</div>
	);
}
