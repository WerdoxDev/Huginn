import clsx from "clsx";
import type { RenderElementProps } from "slate-react";

export default function SpoilerElement(props: RenderElementProps) {
	const [hidden, setHidden] = useState(true);

	return (
		<div
			className={clsx(
				"relative inline-block rounded-sm px-0.5 transition-colors",
				hidden ? "cursor-pointer bg-tertiary text-tertiary" : "bg-white/20",
			)}
			onClick={() => {
				setHidden(false);
			}}
		>
			<span {...props.attributes}>{props.children}</span>
		</div>
	);
}
