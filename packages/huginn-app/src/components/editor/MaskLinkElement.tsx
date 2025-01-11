import type { MaskLinkElement as SlateMaskLinkElement } from "@/index";
import type { RenderElementProps } from "slate-react";

export default function MaskLinkElement(props: RenderElementProps) {
	const huginnWindow = useHuginnWindow();
	const { url } = props.element as SlateMaskLinkElement;

	return (
		<span
			{...props.attributes}
			className="relative cursor-pointer underline"
			onClick={url ? () => (huginnWindow.environment === "desktop" ? open(url) : window.open(url)) : undefined}
		>
			<span>
				{props.children}
				<span className="-mx-0.5 absolute inset-0 hover:bg-text/20" />
			</span>
		</span>
	);
}
