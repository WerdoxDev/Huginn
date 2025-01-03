import type { EmbedElement as SlateEmbedElement } from "@/index";
import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import type { RenderElementProps } from "slate-react";

export default function EmbedElement(props: RenderElementProps) {
	const { image, url, description, title, width, height } = props.element as SlateEmbedElement;

	return (
		<div {...props.attributes} contentEditable={false} className="w-full">
			<div className="mt-1 mb-1 flex flex-col items-start rounded-lg bg-tertiary p-2">
				{title && (
					<span className={clsx(url && "cursor-pointer text-accent hover:underline", "mb-1")} onClick={url ? () => open(url) : undefined}>
						{title}
					</span>
				)}
				{description && <span className="mb-2 text-sm">{description}</span>}
				{image && (
					<div className="w-full max-w-sm" style={{ aspectRatio: `${width ?? 16}/${height ?? 9}` }}>
						<img src={image} alt="huginn" className="w-full rounded-md" />
					</div>
				)}
			</div>
		</div>
	);
}
