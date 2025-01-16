import type { CodeElement as SlateCodeElement } from "@/index";
import hljs from "highlight.js";
import type { RenderElementProps } from "slate-react";

export default function CodeElement(props: RenderElementProps) {
	const { code, language } = props.element as SlateCodeElement;

	const highlighted = useMemo(() => hljs.highlight(code, { language: getCodeLanguage(language ?? "") }), [code]);

	return (
		<div
			{...props.attributes}
			contentEditable={false}
			className="my-1 rounded-md bg-secondary px-2 py-1 font-ubuntu"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
			dangerouslySetInnerHTML={{ __html: highlighted.value }}
		/>
	);
}
