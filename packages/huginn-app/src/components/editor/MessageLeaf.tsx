import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import type { RenderLeafProps } from "slate-react";

export default function MessageLeaf(props: RenderLeafProps) {
	if (props.leaf.mark) {
		return (
			<span className="text-white/50" {...props.attributes}>
				{props.children}
			</span>
		);
	}

	if (props.leaf.bold || props.leaf.italic || props.leaf.underline || props.leaf.link) {
		return (
			<span
				className={clsx(
					props.leaf.bold && "font-bold",
					props.leaf.italic && "italic",
					props.leaf.underline && "underline",
					props.leaf.link && "relative cursor-pointer underline",
				)}
				onClick={props.leaf.link ? () => open(props.leaf.text) : undefined}
				{...props.attributes}
			>
				{props.leaf.link ? (
					<span>
						{props.children}
						<span className="-mx-0.5 absolute inset-0 hover:bg-text/20" />
					</span>
				) : (
					props.children
				)}
			</span>
		);
	}

	return <span {...props.attributes}>{props.children}</span>;
}
