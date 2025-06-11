import VoiceControlls from "@components/VoiceControlls";
import VoiceUser from "@components/VoiceUser";
import VoiceVideo from "@components/VoiceVideo";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useFullscreen } from "@hooks/useFullscreen";
import { useHover } from "@hooks/useHover";
import { useLookup } from "@hooks/useLookup";
import type { Snowflake, Unpacked } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore, voiceStore } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const minHeight = 250;
const maxHeightPercentage = 60;

export default function DirectChannelCall(props: { channelId: Snowflake }) {
	const { voiceState, voiceStates, callStates, remoteSources, speakingStates } = useVoiceStore();

	const { updateModals } = useModals();
	const huginnWindow = useHuginnWindow();

	const client = useClient();
	const { user } = useThisUser();

	const thisVoiceStates = useMemo(() => voiceStates.filter((x) => x.channelId === props.channelId), [voiceStates, props.channelId]);
	const thisCallState = useMemo(() => callStates.find((x) => x.channelId === props.channelId), [callStates, props.channelId]);
	const isGridView = useMemo(() => thisVoiceStates.some((x) => x.selfStream), [thisVoiceStates]);

	const users = useUsers(Array.from(new Set([...(thisCallState?.ringing ?? []), ...thisVoiceStates.map((x) => x.userId)])));
	const usersLookup = useLookup(users, (user) => user.id);
	const usersSpeakingLookup = useLookup(speakingStates, (state) => state.userId);
	const remoteSourcesLookup = useLookup(remoteSources, (source) => source.userId);
	const show = useMemo(() => users.length !== 0 && thisCallState, [props.channelId, users]);

	const [containerRef, showControlls] = useHover<HTMLDivElement>([user, show]);
	const gridRef = useRef<HTMLDivElement>(null);
	const resizerRef = useRef<HTMLDivElement>(null);
	const isResizing = useRef(false);
	const [gridSize, setGridSize] = useState<{ elementWidth: number; elementHeight: number; rows: number; cols: number }>();
	const [gridHeight, setGridHeight] = useState(250);
	const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
	const maximizedSourceId = useRef<string | undefined>(undefined);
	const [maximizedSource, setMaximizedSource] = useState<Unpacked<typeof remoteSources> | undefined>(undefined);

	useEffect(() => {
		if (!voiceState.channelId) {
			maximizedSourceId.current = undefined;
			setMaximizedSource(undefined);
		}
	}, [voiceState]);

	useLayoutEffect(() => {
		const controller = new AbortController();

		window.addEventListener(
			"resize",
			() => {
				if (!gridRef.current) {
					return;
				}

				updateGridSize();
				const maxHeight = (window.innerHeight / 100) * maxHeightPercentage;
				if (gridRef.current.clientHeight > maxHeight) {
					setGridHeight(maxHeight);
				}
			},
			{ signal: controller.signal },
		);

		document.addEventListener(
			"fullscreenchange",
			() => {
				updateGridSize();
			},
			{ signal: controller.signal },
		);

		resizerRef.current?.addEventListener(
			"mousedown",
			(e) => {
				isResizing.current = true;
				document.addEventListener("mousemove", resize);
				document.addEventListener("mouseup", stopResize);
			},
			{ signal: controller.signal },
		);

		return () => {
			controller.abort();
		};
	}, [show]);

	useEffect(() => {
		client.voice.listen("producer_closed", (d) => {
			if (d.producerId === maximizedSourceId.current) {
				maximizedSourceId.current = undefined;
				setMaximizedSource(undefined);
			}
		});
	}, []);

	useLayoutEffect(() => {
		updateGridSize();
	}, [remoteSources, voiceStates, gridHeight, thisCallState, maximizedSource, isFullscreen, thisVoiceStates]);

	function resize(e: MouseEvent) {
		if (!gridRef.current || !isResizing.current) {
			return;
		}

		const maxHeight = (window.innerHeight / 100) * maxHeightPercentage;

		const rect = gridRef.current.getBoundingClientRect();
		const newHeight = Math.min(Math.max(e.clientY - rect.top + 2, minHeight), maxHeight);
		setGridHeight(newHeight);
	}

	function stopResize() {
		isResizing.current = false;
		document.removeEventListener("mousemove", resize);
		document.removeEventListener("mouseup", stopResize);
	}

	function disconnect() {
		client.gateway.disconnectFromVoice();
	}

	function toggleMute() {
		client.gateway.updateVoiceState(!voiceState.selfMute, false, voiceState.selfStream, voiceState.selfVideo);
	}

	function toggleDeafen() {
		client.gateway.updateVoiceState(!voiceState.selfDeaf, !voiceState.selfDeaf, voiceState.selfStream, voiceState.selfVideo);
	}

	async function stream() {
		if (isFullscreen) {
			toggleFullscreen();
		}

		if (huginnWindow.environment === "browser") {
			const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
			await client.voice.startScreensharing(stream.getVideoTracks()[0], stream.getAudioTracks()[0]);

			client.gateway.updateVoiceState(voiceState.selfMute, voiceState.selfDeaf, true, voiceState.selfVideo);
		} else {
			updateModals({ screenshare: { isOpen: true } });
		}
	}

	async function connect() {
		await client.gateway.connectToVoice(null, props.channelId);
	}

	function maximizeSource(producerId: string) {
		if (maximizedSource) {
			maximizedSourceId.current = undefined;
			setMaximizedSource(undefined);
		} else {
			maximizedSourceId.current = producerId;
			const foundSource = remoteSources.find((x) => x.producerId === maximizedSourceId.current);
			if (foundSource) {
				setMaximizedSource(foundSource);
			}
		}
	}

	function updateGridSize() {
		if (!gridRef.current) {
			return;
		}

		const store = voiceStore.getState();
		const numBoxes = maximizedSourceId.current
			? 1
			: store.voiceStates.length +
				store.remoteSources.filter((x) => x.kind === "screen_video" || x.kind === "camera").length +
				(thisCallState?.ringing.length ?? 0) +
				(!voiceState.channelId ? thisVoiceStates.filter((x) => x.selfStream).length : 0);
		const containerWidth = gridRef.current.clientWidth;
		const containerHeight = gridRef.current.clientHeight;
		const boxMargin = !maximizedSourceId.current ? 12 : 0;
		const padding = {
			top: !maximizedSourceId.current ? 12 : 0,
			right: !maximizedSourceId.current ? 20 : 0,
			bottom: !maximizedSourceId.current ? 64 : 0,
			left: !maximizedSourceId.current ? 20 : 0,
		};
		const aspectRatio = 16 / 9;

		let best = {
			elementWidth: 0,
			elementHeight: 0,
			rows: 0,
			cols: 0,
		};

		for (let rows = 1; rows <= numBoxes; rows++) {
			const cols = Math.ceil(numBoxes / rows);

			// Total spacing from margins
			const totalMarginX = (cols - 1) * boxMargin;
			const totalMarginY = (rows - 1) * boxMargin;

			// Usable space after subtracting padding and internal margins
			const usableWidth = containerWidth - padding.left - padding.right - totalMarginX;
			const usableHeight = containerHeight - padding.top - padding.bottom - totalMarginY;

			// Max box size
			let elementWidth = usableWidth / cols;
			let elementHeight = elementWidth / aspectRatio;

			// If height overflows, resize based on height instead
			if (elementHeight > usableHeight / rows) {
				elementHeight = usableHeight / rows;
				elementWidth = elementHeight * aspectRatio;
			}

			if (elementWidth * elementHeight > best.elementWidth * best.elementHeight) {
				best = {
					elementWidth,
					elementHeight,
					rows,
					cols,
				};
			}
		}

		setGridSize(best);
	}

	if (!user || !show) {
		return;
	}

	return (
		<div
			className={clsx(
				"relative z-10 flex shrink-0 select-none flex-col gap-y-3 overflow-hidden shadow-lg shadow-tertiary/50",
				isFullscreen ? "rounded-none bg-tertiary" : "m-2 mb-0 rounded-xl bg-black/50 ring-2 ring-primary/70",
			)}
			ref={containerRef}
		>
			<div ref={resizerRef} className="-bottom-1 absolute inset-x-0 z-10 h-2 cursor-ns-resize" />
			<div
				className={clsx("flex w-full shrink flex-wrap content-center items-center justify-center gap-3", !maximizedSource && "px-5 py-2 pb-16")}
				ref={gridRef}
				style={{ height: !isFullscreen ? gridHeight : "100%" }}
			>
				{isGridView &&
					remoteSources
						.filter((x) => (maximizedSource ? x.producerId === maximizedSource.producerId : x.kind === "screen_video" || x.kind === "camera"))
						.map((x) => (
							<VoiceVideo
								kind={x.kind}
								user={usersLookup[x.userId]}
								maximized={!!maximizedSource}
								onClick={maximizeSource}
								key={x.userId}
								consumerId={x.consumerId}
								producerId={x.producerId}
								gridElementWidth={gridSize?.elementWidth ?? 0}
								srcObject={x.srcObject}
							/>
						))}
				{isGridView &&
					!voiceState.channelId &&
					thisVoiceStates
						.filter((x) => x.selfStream)
						.map((x) => (
							<div
								key={x.userId}
								className="flex aspect-video items-center justify-center rounded-xl bg-background"
								style={{ width: gridSize?.elementWidth ?? 0 }}
							>
								<button
									onClick={connect}
									type="button"
									className="rounded-lg border border-text/80 bg-secondary px-4 py-2 text-text shadow-xl transition-colors hover:bg-tertiary"
								>
									Watch
								</button>
							</div>
						))}
				{!maximizedSource &&
					thisCallState?.ringing.map((x) => (
						<VoiceUser key={x} ringing={true} gridElementWidth={gridSize?.elementWidth ?? 0} isGridView={isGridView} user={usersLookup[x]} />
					))}
				{!maximizedSource &&
					thisVoiceStates.map((x) => (
						<VoiceUser
							key={x.userId}
							gridElementWidth={gridSize?.elementWidth ?? 0}
							isGridView={isGridView}
							speaking={usersSpeakingLookup[x.userId]?.speaking}
							user={usersLookup[x.userId]}
							voiceState={x}
							producerId={remoteSourcesLookup[x.userId]?.producerId}
						/>
					))}
			</div>
			<VoiceControlls
				show={showControlls}
				isFullscreen={isFullscreen}
				isInVoice={voiceState.channelId === props.channelId}
				onConnect={connect}
				onDisconnect={disconnect}
				onStream={stream}
				onEndStream={() => client.voice.stopScreensharing()}
				onToggleDeafen={toggleDeafen}
				onToggleFullscreen={toggleFullscreen}
				onToggleMute={toggleMute}
				voiceState={voiceState}
			/>
		</div>
	);
}
