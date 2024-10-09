import type { RenderLeafProps } from "slate-react";

export default function EditorLeaf(props: RenderLeafProps) {
	if (props.leaf.bold) {
		return (
			<span className="font-bold" {...props.attributes}>
				{props.children}
			</span>
		);
	}

	if (props.leaf.italic) {
		return (
			<span className="italic" {...props.attributes}>
				{props.children}
			</span>
		);
	}

	if (props.leaf.underline) {
		return (
			<span className="underline" {...props.attributes}>
				{props.children}
			</span>
		);
	}

	if (props.leaf.spoiler) {
		return (
			<span className="rounded-sm bg-white/20 px-0.5" {...props.attributes}>
				{props.children}
			</span>
		);
	}

	if (props.leaf.mark) {
		return (
			<span className="text-white/50" {...props.attributes}>
				{props.children}
			</span>
		);
	}
	return <span {...props.attributes}>{props.children}</span>;
}
