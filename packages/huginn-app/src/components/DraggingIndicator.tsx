import { useChannelName, useCurrentChannel } from "@hooks/api-hooks/channelHooks";

export default function DraggingIndicator(props: { isDragging: boolean }) {
	const channel = useCurrentChannel();
	const name = useChannelName(channel?.id);

	if (!channel) {
		return;
	}

	return (
		props.isDragging && (
			<div className="fixed inset-0 top-6 z-10 flex items-center justify-center bg-tertiary/60">
				<div className="relative flex rounded-2xl bg-primary p-2.5">
					<div className="rounded-xl border-2 border-accent border-dashed p-5 ">
						<div className="-top-8 absolute inset-x-0 flex items-center justify-center">
							<div className="absolute bottom-4 h-5 w-5 bg-background" />
							<IconMingcuteFileUploadFill className="z-10 size-16 text-text" />
						</div>
						<div className="text-lg text-text">
							Upload to <span className="font-bold">{name}</span>
						</div>
					</div>
				</div>
			</div>
		)
	);
}
