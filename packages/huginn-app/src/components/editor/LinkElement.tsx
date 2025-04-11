import type { LinkElement as SlateLinkElement } from "@/index";
import { useHuginnWindow } from "@stores/windowStore";
import type { RenderElementProps } from "slate-react";

export default function LinkElement(props: RenderElementProps) {
	const huginnWindow = useHuginnWindow();
	const { url } = props.element as SlateLinkElement;

	return (
		<span
			{...props.attributes}
			className="relative inline-block cursor-pointer underline"
			//TODO: MIGRATION
			onClick={url ? () => (huginnWindow.environment === "desktop" ? window.electronAPI.openExteral(url) : window.open(url)) : undefined}
			title={url}
		>
			<div className="">
				{props.children}
				<div className="-mx-0.5 absolute inset-0 rounded-sm hover:bg-text/20" />
			</div>
		</span>
	);
}
