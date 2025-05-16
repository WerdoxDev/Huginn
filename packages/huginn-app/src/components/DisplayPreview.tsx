import type { DisplaySource } from "@/types";
import { useEffect, useMemo } from "react";

export default function DisplayPreview(props: { source: DisplaySource; onSelect: (source: DisplaySource) => void }) {
	useEffect(() => {
		// console.log(thumbnail, props.name, props.thumbnail, props);
	}, []);
	return (
		<div className="flex h-36 flex-col gap-y-2">
			<img
				src={props.source.thumbnail}
				alt={props.source.id}
				className="aspect-video w-full cursor-pointer rounded-lg object-cover transition-all hover:ring-2 hover:ring-primary"
				onClick={() => props.onSelect(props.source)}
			/>
			<div className="overflow-hidden text-ellipsis whitespace-nowrap px-2 text-center font-semibold text-sm text-white">{props.source.name}</div>
		</div>
	);
}
