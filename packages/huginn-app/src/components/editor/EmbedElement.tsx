import type { EmbedElement as SlateEmbedElement } from "@/index";
import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import type { RenderElementProps } from "slate-react";

export default function EmbedElement(props: RenderElementProps) {
	const { image, url, description, title, width, height } = props.element as SlateEmbedElement;

	return (
		<div {...props.attributes} contentEditable={false} className="w-96">
			<div className="mt-1 mb-1 flex flex-col items-start rounded-lg bg-tertiary p-2">
				{title && (
					<span
						className={clsx(url && "cursor-pointer text-accent hover:underline", description && "mb-1")}
						onClick={url ? () => open(url) : undefined}
					>
						{title}
					</span>
				)}
				{description && <span className={clsx("text-sm", image && "mb-2")}>{description}</span>}
				{image && (
					<div className="w-full" style={{ aspectRatio: `${width ?? 16}/${height ?? 9}` }}>
						<img src={image} alt="huginn" className="w-full rounded-md" />
					</div>
				)}
			</div>
		</div>
	);
}
