import type { EmbedElement as SlateEmbedElement } from "@/index";
import { open } from "@tauri-apps/plugin-shell";
import clsx from "clsx";
import type { RenderElementProps } from "slate-react";

export default function EmbedElement(props: RenderElementProps) {
	const { image, url, description, title } = props.element as SlateEmbedElement;

	return (
		<div {...props.attributes} contentEditable={false} className="w-full">
			<div className="mt-1 mb-1 flex flex-col items-start rounded-lg bg-tertiary p-2">
				{title && (
					<span className={clsx(url && "cursor-pointer text-accent hover:underline", "mb-1")} onClick={url ? () => open(url) : undefined}>
						{title}
					</span>
				)}
				{description && <span className="mb-2 text-sm">{description}</span>}
				{image && <img src={image} alt="huginn" className="max-w-sm rounded-md" />}
			</div>
		</div>
	);
}

// export default function EmbedElement(props: { title?: string; description?: string; url?: string; image?: string }) {
// 	const { image, url, description, title } = props;

// 	return (
// 		<div className="max-w-md">
// 			<div className="mt-2 flex flex-col rounded-xl bg-primary/70 p-2">
// 				{title && (
// 					<span className={clsx(url && "cursor-pointer text-white underline", "mb-1")} onClick={url ? () => open(url) : undefined}>
// 						{title}
// 					</span>
// 				)}
// 				{description && <span className="mb-2 text-sm">{description}</span>}
// 				{image && <img src={image} alt="huginn" className="w=full rounded-lg" />}
// 			</div>
// 		</div>
// 	);
// }
