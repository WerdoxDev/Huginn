import type { CodeElement as SlateCodeElement } from "@/index";
import type { RenderElementProps } from "slate-react";

export default function CodeElement(props: RenderElementProps) {
	const { code, language } = props.element as SlateCodeElement;

	return (
		<div {...props.attributes} contentEditable={false} className="bg-tertiary">
			<span>lang: {language}</span>
			<br />
			<span>code: {code}</span>
		</div>
	);
}
