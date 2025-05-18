import clsx from "clsx";
import { useEffect, useRef } from "react";
import LoadingIcon from "./LoadingIcon";

export default function VoiceVideo(props: {
	consumerId?: string;
	producerId?: string;
	gridElementWidth: number;
	srcObject?: MediaProvider;
	maximized?: boolean;
	onClick: (producerId: string) => void;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.srcObject = props.srcObject ?? null;
		}
	}, [props.srcObject]);

	return (
		<div
			onClick={() => props.onClick(props.producerId ?? "")}
			key={props.consumerId ?? props.producerId}
			id={props.consumerId}
			className={clsx(
				"relative flex aspect-video shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden bg-tertiary",
				!props.maximized && "rounded-xl",
			)}
			style={{ width: props.gridElementWidth }}
		>
			{!props.srcObject ? <LoadingIcon /> : <video className="h-full w-full" ref={videoRef} autoPlay playsInline muted />}
		</div>
	);
}
