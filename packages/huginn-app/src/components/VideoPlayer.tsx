import { Transition } from "@headlessui/react";
import { formatSeconds } from "@huginn/shared";
import clsx from "clsx";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import LoadingIcon from "./LoadingIcon";

export default function VideoPlayer(props: { url: string; width: number; height: number; type: string }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const progressRef = useRef<HTMLDivElement>(null);
	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [buffer, setBuffer] = useState(0);
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
				setProgress((current / duration) * 100);
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
						console.log(percentage);
						setBuffer(percentage);
					}
				}
			},
			{ signal: controller.signal },
		);

		document.addEventListener(
			"mousemove",
			(e) => {
				if (dragging.current) setVideoProgress(e.pageX);
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

		return () => {
			controller.abort();
		};
	}, []);

	function setVideoProgress(mouseX: number) {
		if (!progressRef.current) {
			return;
		}
		// e.currentTarget.
		// const pos = (e.pageX - progress.offsetLeft - progress.offsetParent.offsetLeft) / progress.offsetWidth;
		const rect = progressRef.current.getBoundingClientRect();
		const percentage = Math.min(Math.max(0, ((mouseX - rect.left) / (rect.right - rect.left)) * 100), 100);
		const duration = videoRef.current?.duration ?? 0;

		if (videoRef.current) {
			const time = (duration / 100) * percentage;
			videoRef.current.currentTime = (duration / 100) * percentage;
			setVideoTime(time);
			setProgress(percentage);
		}

		// video.currentTime = pos * video.duration;
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
				className="absolute inset-x-0 bottom-0 flex translate-y-full items-center gap-x-2 bg-tertiary/90 px-2 py-2 opacity-0 transition-[opacity,transform] group-hover/video:translate-y-0 group-hover/video:opacity-100"
				onClick={(e) => e.stopPropagation()}
			>
				<button type="button" onClick={togglePlaying} className="shrink-0 text-white/80 hover:text-white">
					{playing ? <IconMingcutePauseFill className="size-6" /> : <IconMingcutePlayFill className="size-6" />}
				</button>
				<div className="shrink-0 text-sm">
					{formatSeconds(videoTime)} / {formatSeconds(videoDuration)}
				</div>
				<div
					ref={progressRef}
					className="group/progress relative flex h-2 w-full cursor-pointer items-center rounded-md bg-white/20"
					onClick={(e) => setVideoProgress(e.pageX)}
					onMouseDown={(e) => {
						dragging.current = true;
						e.preventDefault();
					}}
				>
					<div className="absolute h-full rounded-md bg-white/30 transition-[width]" style={{ width: `${buffer}%` }} />
					<div className="absolute h-full rounded-md bg-accent" style={{ width: `${progress}%` }} />
					<div
						className="absolute h-4 w-4 scale-0 rounded-full bg-text transition-transform group-hover/progress:scale-100"
						style={{ left: `calc(${progress}% - 8px)` }}
					/>
				</div>
			</div>
		</div>
	);
}
