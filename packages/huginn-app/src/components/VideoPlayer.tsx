import { Transition } from "@headlessui/react";
import { formatSeconds } from "@huginn/shared";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import LoadingIcon from "./LoadingIcon";

const OFFSET_PERCENTAGE = 3;
export default function VideoPlayer(props: { url: string; width: number; height: number; type: string }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const progressRef = useRef<HTMLDivElement>(null);
	const [playing, setPlaying] = useState(false);
	const [progressPercentage, setProgressPercentage] = useState(0);
	const [bufferPercentage, setBufferPercentage] = useState(0);
	const [videoDuration, setVideoDuration] = useState(0);
	const [videoTime, setVideoTime] = useState(0);
	const [loaded, setLoaded] = useState(false);
	const [errored, setErrored] = useState(false);
	const dragging = useRef(false);

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

				let passedPercentage = (current / duration) * 100;
				passedPercentage = Math.max(0, Math.min(100, passedPercentage));

				const visualPercentage = (passedPercentage / 100) * (100 - OFFSET_PERCENTAGE) + OFFSET_PERCENTAGE;
				const clampedVisualPercentage = Math.max(OFFSET_PERCENTAGE, Math.min(100, visualPercentage));

				setProgressPercentage(clampedVisualPercentage);
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
						setBufferPercentage(percentage);
					}
				}
			},
			{ signal: controller.signal },
		);

		document.addEventListener(
			"mousemove",
			(e) => {
				if (dragging.current) setVideoProgressFromMouse(e.pageX);
			},
			{ signal: controller.signal },
		);

		document.addEventListener(
			"mouseup",
			() => {
				dragging.current = false;
			},
			{ signal: controller.signal },
		);

		setProgressPercentage(OFFSET_PERCENTAGE);

		return () => {
			controller.abort();
		};
	}, []);

	function setVideoProgressFromMouse(mouseX: number) {
		if (!progressRef.current) {
			return;
		}
		const rect = progressRef.current.getBoundingClientRect();
		const x = mouseX - rect.left;

		let percentage = (x / rect.width) * 100;
		percentage = Math.max(0, percentage - OFFSET_PERCENTAGE);
		percentage = Math.min(100 - OFFSET_PERCENTAGE, percentage);

		let actualPercentage = (percentage / (100 - OFFSET_PERCENTAGE)) * 100;
		actualPercentage = Math.max(0, Math.min(100, actualPercentage));

		percentage = Math.max(percentage + OFFSET_PERCENTAGE, OFFSET_PERCENTAGE);
		if (videoRef.current) {
			const duration = videoRef.current?.duration ?? 0;
			const time = (duration / 100) * actualPercentage;
			videoRef.current.currentTime = time;
			setVideoTime(time);
			setProgressPercentage(percentage);
		}
	}

	function togglePlaying() {
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
			onClick={togglePlaying}
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
				<div
					className="group/progress relative flex h-2 w-[400px] cursor-pointer items-center rounded-md bg-white/20"
					onClick={(e) => setVideoProgressFromMouse(e.pageX)}
					onMouseDown={(e) => {
						dragging.current = true;
						e.preventDefault();
					}}
					ref={progressRef}
				>
					<div className="absolute h-full rounded-md bg-white/30 transition-[width]" style={{ width: `${bufferPercentage}%` }} />
					<div className="absolute h-full rounded-md bg-accent" style={{ width: `${progressPercentage}%` }} />
					<div
						className="absolute h-4 w-4 scale-0 rounded-full bg-text/50 transition-transform group-hover/progress:scale-100"
						style={{ left: `calc(${progressPercentage}% - 8px)` }}
					/>
				</div>
			</div>
		</div>
	);
}
