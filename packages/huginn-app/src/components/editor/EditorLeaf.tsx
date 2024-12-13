import { hasFlag } from "@huginn/shared";
import { TokenTypeFlag } from "@lib/huginn-tokenizer";
import clsx from "clsx";
import type { RenderLeafProps } from "slate-react";

export default function EditorLeaf(props: RenderLeafProps) {
	if (props.leaf.mark) {
		return (
			<span className="text-white/50" {...props.attributes}>
				{props.children}
			</span>
		);
	}

	if (props.leaf.bold || props.leaf.italic || props.leaf.underline || props.leaf.spoiler) {
		return (
			<span
				className={clsx(
					props.leaf.bold && "font-bold",
					props.leaf.italic && "italic",
					props.leaf.underline && "underline",
					props.leaf.spoiler && "rounded-sm px-0.5",
					props.leaf.spoiler && props.leaf.text !== " " && "bg-white/20",
				)}
				{...props.attributes}
			>
				{props.children}
			</span>
		);
	}
	return <span {...props.attributes}>{props.children}</span>;
}
