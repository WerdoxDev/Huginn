export default function VoiceVideo(props: {
	consumerId?: string;
	producerId?: string;
	gridElementWidth: number;
	srcObject: MediaProvider;
	onClick: (producerId: string) => void;
}) {
	return (
		<div
			onClick={() => props.onClick(props.producerId ?? "")}
			key={props.consumerId ?? props.producerId}
			id={props.consumerId}
			className="relative flex aspect-video shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-tertiary"
			style={{ width: props.gridElementWidth }}
		>
			<video
				className="h-full w-full"
				ref={(el) => {
					if (el && !el.srcObject) {
						el.srcObject = props.srcObject;
					}
				}}
				autoPlay
				playsInline
				muted
			/>
		</div>
	);
}
