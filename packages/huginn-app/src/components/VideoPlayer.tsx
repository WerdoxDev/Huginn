import { Transition } from "@headlessui/react";
import { useProgressBar } from "@hooks/useProgressBar";
import { useTimeout } from "@hooks/useTimeout";
import { formatSeconds } from "@huginn/shared";
import clsx from "clsx";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import LoadingIcon from "./LoadingIcon";
import ProgressBar from "./ProgressBar";

export default function VideoPlayer(props: { url: string; width: number; height: number; type: string }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [playing, setPlaying] = useState(false);
	const videoProgress = useProgressBar({ startOffset: 2, endOffset: 0, mouseOffset: 5 });
	const audioProgress = useProgressBar({ startOffset: 10, endOffset: 0, mouseOffset: 5, defaultValue: 100 });
	const [audioHovering, setAudioHovering] = useState(false);
	const [videoDuration, setVideoDuration] = useState(0);
	const [videoTime, setVideoTime] = useState(0);
	const [loaded, setLoaded] = useState(false);
	const [errored, setErrored] = useState(false);
	const { cancel: cancelTimeout, start: startTimeout } = useTimeout(() => setAudioHovering(false), 1000);

	useEffect(() => {
		const controller = new AbortController();

		videoRef.current?.addEventListener(
			"play",
			() => {
				setPlaying(true);
			},
			{ signal: controller.signal },
		);

		videoRef.current?.addEventListener(
			"pause",
			() => {
				setPlaying(false);
			},
			{ signal: controller.signal },
		);

		videoRef.current?.addEventListener("loadedmetadata", () => {
			setVideoDuration(videoRef.current?.duration ?? 0);
		});

		videoRef.current?.addEventListener(
			"timeupdate",
			() => {
				const current = videoRef.current?.currentTime ?? 0;
				const duration = videoRef.current?.duration ?? 0;
				setVideoTime(current);

				const percentage = (current / duration) * 100;
				videoProgress.setPercentage(videoProgress.getVisualPercentage(percentage));
			},
			{ signal: controller.signal },
		);

		videoRef.current?.addEventListener(
			"progress",
			() => {
				const buffered = videoRef.current?.buffered;

				if (buffered && buffered.length > 0) {
					const end = buffered.end(buffered.length - 1); // Get the end time of the first (and typically only) buffered range
					const duration = videoRef.current?.duration ?? 0;

					if (duration > 0) {
						const percentage = (end / duration) * 100;
						videoProgress.setBufferPercentage(videoProgress.getVisualPercentage(percentage));
					}
				}
			},
			{ signal: controller.signal },
		);

		return () => {
			controller.abort();
		};
	}, []);

	function setVideoPercentage(percentage: number) {
		if (videoRef.current) {
			const duration = videoRef.current?.duration ?? 0;
			const time = (duration / 100) * percentage;
			videoRef.current.currentTime = time;
			setVideoTime(time);
		}
	}

	function setAudioPercentage(percentage: number) {
		if (videoRef.current) {
			videoRef.current.volume = percentage / 100;
		}
	}

	function cancelAudioHoverTimeout() {
		console.log("CANCEL");
		cancelTimeout();
		setAudioHovering(true);
	}

	function startAudioHoverTimeout(e: MouseEvent) {
		e.stopPropagation();
		startTimeout();
	}

	function togglePlaying() {
		if (audioProgress.dragging || videoProgress.dragging) {
			return;
		}

		if (playing) {
			videoRef.current?.pause();
		} else {
			videoRef.current?.play();
		}
	}
	return (
		<div
			style={{ width: `${props.width}px`, height: `${props.height}px` }}
			className="group/video relative overflow-hidden rounded-lg"
			onMouseUp={togglePlaying}
			// onClick={togglePlaying}
		>
			{/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
			<video
				width={props.width}
				height={props.height}
				style={{ width: `${props.width}px`, height: `${props.height}px` }}
				src={props.url}
				ref={videoRef}
				onLoadedData={() => setLoaded(true)}
				onError={() => setErrored(true)}
			/>
			<Transition show={!loaded || errored}>
				<div
					className={clsx(
						!errored && "absolute inset-0",
						"flex items-center justify-center rounded-md bg-background/40 duration-200 data-[closed]:opacity-0",
					)}
					style={{ width: `${props.width}px`, height: `${props.height}px` }}
				>
					{!loaded && !errored && <LoadingIcon className="size-16" />}
					{errored && <IconMingcuteWarningFill className="size-16 text-error" />}
				</div>
			</Transition>
			<div
				className={clsx(
					"absolute inset-x-0 bottom-0 flex items-center gap-x-2 bg-tertiary/90 px-2 py-2 transition-[opacity,transform]",
					playing && "translate-y-full opacity-0 group-hover/video:translate-y-0 group-hover/video:opacity-100",
				)}
				onClick={(e) => e.stopPropagation()}
			>
				<button type="button" onClick={togglePlaying} className="shrink-0 text-white/80 hover:text-white">
					{playing ? <IconMingcutePauseFill className="size-6" /> : <IconMingcutePlayFill className="size-6" />}
				</button>
				<div className="shrink-0 text-sm">
					{formatSeconds(videoTime)} / {formatSeconds(videoDuration)}
				</div>
				<ProgressBar {...videoProgress} orientation="horizontal" onPercentageChange={setVideoPercentage} />
				<div className="relative flex cursor-pointer items-center justify-center">
					<IconMingcuteVolumeFill
						className="size-6 shrink-0 text-white/80 hover:text-white"
						onMouseLeave={startAudioHoverTimeout}
						onMouseEnter={cancelAudioHoverTimeout}
					/>
					{(audioHovering || audioProgress.dragging) && (
						<div
							className="absolute bottom-10 h-24 w-4 rounded-lg bg-tertiary/90 p-1"
							onMouseEnter={cancelAudioHoverTimeout}
							onMouseLeave={startAudioHoverTimeout}
							onMouseUp={(e) => {
								e.stopPropagation();
								console.log("UP");
							}}
						>
							<ProgressBar {...audioProgress} orientation="vertical" onPercentageChange={setAudioPercentage} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
