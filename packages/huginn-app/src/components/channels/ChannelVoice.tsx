import { useClient } from "@contexts/apiContext";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export default function ChannelVoice() {
	const [show, setShow] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);
	// const remoteVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
	const [remoteVideos, setRemoteVideos] = useState<Array<{ consumerId: string; producerId: string; srcObject: MediaProvider }>>([]);
	const client = useClient();

	async function transportReady() {
		if (!videoRef.current) {
			return;
		}

		setShow(true);

		const localStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});

		videoRef.current.srcObject = localStream;

		const audioTrack = localStream.getAudioTracks()[0];
		const videoTrack = localStream.getVideoTracks()[0];

		await client.voice.startStreaming(videoTrack, audioTrack);
	}

	async function producerCreated(d: { track: MediaStreamTrack; consumerId: string; producerId: string }) {
		const remoteStream = new MediaStream([d.track]);
		setRemoteVideos((old) => [...old, { consumerId: d.consumerId, producerId: d.producerId, srcObject: remoteStream }]);
	}

	function producerRemoved(d: { producerId: string }) {
		setRemoteVideos((old) => old.filter((x) => x.producerId !== d.producerId));
	}

	useEffect(() => {
		client.voice.on("transport_ready", transportReady);
		client.voice.on("producer_created", producerCreated);
		client.voice.on("producer_removed", producerRemoved);

		return () => {
			client.voice.off("transport_ready", transportReady);
			client.voice.off("producer_created", producerCreated);
			client.voice.off("producer_removed", producerRemoved);
		};
	}, []);

	return (
		<div className={clsx("m-2 flex h-80 items-center justify-center rounded-xl bg-background ring-2 ring-primary/70", show ? "block" : "hidden")}>
			<video className="aspect-video w-44 rounded-lg" ref={videoRef} autoPlay playsInline muted />
			<div className="flex">
				{remoteVideos.map((x) => (
					<video
						key={x.consumerId}
						className="aspect-video w-44 rounded-lg"
						ref={(el) => {
							if (el) {
								el.srcObject = x.srcObject;
							}
						}}
						autoPlay
						playsInline
						muted
					/>
				))}
			</div>
		</div>
	);
}
