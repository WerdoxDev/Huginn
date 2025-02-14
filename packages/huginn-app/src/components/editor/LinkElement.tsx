import type { LinkElement as SlateLinkElement } from "@/index";
import { useHuginnWindow } from "@stores/windowStore";
import { open } from "@tauri-apps/plugin-shell";
import type { RenderElementProps } from "slate-react";

export default function LinkElement(props: RenderElementProps) {
	const huginnWindow = useHuginnWindow();
	const { url } = props.element as SlateLinkElement;

	return (
		<span
			{...props.attributes}
			className="relative cursor-pointer underline"
			onClick={url ? () => (huginnWindow.environment === "desktop" ? open(url) : window.open(url)) : undefined}
			title={url}
		>
			<span>
				{props.children}
				<span className="-mx-0.5 absolute inset-0 hover:bg-text/20" />
			</span>
		</span>
	);
}
