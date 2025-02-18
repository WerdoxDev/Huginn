import type { EmbedElement as SlateEmbedElement } from "@/index";
import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import type { RenderElementProps } from "slate-react";

export default function EmbedElement(props: RenderElementProps) {
	const { image, url, description, title, width, height } = props.element as SlateEmbedElement;

	return (
		<div {...props.attributes} contentEditable={false} style={{ maxWidth: `clamp(40ch, ${width}px,25rem)` }}>
			<div className="mt-1 mb-1 flex max-w-md flex-col items-start rounded-lg bg-tertiary p-2">
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
					<img
						src={image}
						alt="huginn"
						className="rounded-md"
						loading="lazy"
						style={{ width: `min(24rem,${width}px)`, height: `min(20rem,${height}px)` }}
					/>
				)}
			</div>
		</div>
	);
}
