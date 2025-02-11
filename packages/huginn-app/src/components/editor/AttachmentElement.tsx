import type { AttachmentElement as SlateAttachmentElement } from "@/index";
import { FileTypes } from "@huginn/shared";
import clsx from "clsx";
import type { RenderElementProps } from "slate-react";

export default function AttachmentElement(props: RenderElementProps) {
	const { contentType, url, description, size, width, height } = props.element as SlateAttachmentElement;

	return (
		<div {...props.attributes} contentEditable={false} className="w-80">
			<div className="mt-1 mb-1 flex flex-col items-start rounded-lg">
				{description && <span className={clsx("text-sm")}>{description}</span>}
				{contentType !== FileTypes.other && contentType !== FileTypes.zip && (
					<div className="w-full" style={{ aspectRatio: `${width ?? 16}/${height ?? 9}` }}>
						<img src={url} alt="huginn" className="w-full rounded-md" />
					</div>
				)}
			</div>
		</div>
	);
}
