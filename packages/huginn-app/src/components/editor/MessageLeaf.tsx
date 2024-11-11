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

	if (props.leaf.bold || props.leaf.italic || props.leaf.underline) {
		return (
			<span
				className={clsx(props.leaf.bold && "font-bold", props.leaf.italic && "italic", props.leaf.underline && "underline")}
				{...props.attributes}
			>
				{props.children}
			</span>
		);
	}

	if (props.leaf.spoiler) {
		return <SpoilerLeaf {...props} />;
	}

	return <span {...props.attributes}>{props.children}</span>;
}

function SpoilerLeaf(props: RenderLeafProps) {
	const [hidden, setHidden] = useState(true);

	return (
		<span
			className={clsx("inline-block rounded-sm px-0.5 transition-colors", hidden ? "cursor-pointer bg-tertiary text-tertiary" : "bg-white/20")}
			{...props.attributes}
			onClick={() => {
				setHidden(false);
			}}
		>
			{props.children}
		</span>
	);
}
