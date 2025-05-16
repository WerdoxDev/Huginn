import VoiceControlls from "@components/VoiceControlls";
import VoiceUser from "@components/VoiceUser";
import VoiceVideo from "@components/VoiceVideo";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useFullscreen } from "@hooks/useFullscreen";
import { useLookup } from "@hooks/useLookup";
import type { Snowflake, Unpacked } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore, voiceStore } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

const minHeight = 250;
const maxHeightPercentage = 60;

export default function DirectChannelCall(props: { channelId: Snowflake }) {
	const { voiceState, voiceStates, callStates, remoteSources, speakingStates } = useVoiceStore();

	const { updateModals } = useModals();
	const huginnWindow = useHuginnWindow();

	const containerRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const resizerRef = useRef<HTMLDivElement>(null);
	const isResizing = useRef(false);
	const [gridSize, setGridSize] = useState<{ elementWidth: number; elementHeight: number; rows: number; cols: number }>();
	const [gridHeight, setGridHeight] = useState(250);
	const { isFullscreen, toggleFullscreen } = useFullscreen();
	const maximizedSourceId = useRef<string | undefined>(undefined);
	const [maximizedSource, setMaximizedSource] = useState<Unpacked<typeof remoteSources> | undefined>(undefined);

	const client = useClient();
	const { user } = useThisUser();

	const thisVoiceStates = useMemo(() => voiceStates.filter((x) => x.channelId === props.channelId), [voiceStates, props.channelId]);
	const thisCallState = useMemo(() => callStates.find((x) => x.channelId === props.channelId), [callStates, props.channelId]);
	const isGridView = useMemo(() => remoteSources.some((x) => x.kind === "video"), [remoteSources]);

	const users = useUsers(Array.from(new Set([...(thisCallState?.ringing ?? []), ...thisVoiceStates.map((x) => x.userId)])));
	const usersLookup = useLookup(users, (user) => user.id);
	const usersSpeakingLookup = useLookup(speakingStates, (state) => state.userId);
	const show = useMemo(() => users.length !== 0 && thisCallState, [props.channelId, users]);

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

	useLayoutEffect(() => {
		updateGridSize();
	}, [remoteSources, voiceStates, gridHeight, thisCallState, maximizedSource]);

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
		client.gateway.updateVoiceState(!voiceState.selfMute, false);
	}

	function toggleDeafen() {
		client.gateway.updateVoiceState(!voiceState.selfDeaf, !voiceState.selfDeaf);
	}

	function updateGridSize() {
		if (!gridRef.current) {
			return;
		}

		const store = voiceStore.getState();
		const numBoxes = maximizedSourceId.current
			? 1
			: store.voiceStates.length + store.remoteSources.filter((x) => x.kind === "video").length + (thisCallState?.ringing.length ?? 0);
		console.log(numBoxes);
		const containerWidth = gridRef.current.clientWidth;
		const containerHeight = gridRef.current.clientHeight;
		const boxMargin = 12;
		const padding = {
			top: 12,
			right: 20,
			bottom: 64,
			left: 20,
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

		console.log(best);

		setGridSize(best);
		// setGridElementWidth(best.boxWidth);
	}

	async function screenshare() {
		if (isFullscreen) {
			toggleFullscreen();
		}

		if (huginnWindow.environment === "browser") {
			const stream = await navigator.mediaDevices.getDisplayMedia({ audio: false, video: true });
			await client.voice.startScreenSharing(stream.getVideoTracks()[0], stream.getAudioTracks()[0]);
		} else {
			updateModals({ screenShare: { isOpen: true } });
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

	if (!user || !show) {
		return;
	}

	return (
		<div
			className={clsx(
				"flex shrink-0 flex-col gap-y-3 shadow-lg shadow-tertiary/50",
				isFullscreen ? "fixed inset-0 z-50 rounded-none bg-black" : "relative z-10 m-2 mb-0 rounded-xl bg-black/60 ring-2 ring-primary/70",
			)}
			ref={containerRef}
		>
			<div ref={resizerRef} className="-bottom-1 absolute inset-x-0 h-2 cursor-ns-resize" />
			<div
				className="flex w-full shrink flex-wrap items-center justify-center gap-3 px-5 py-2 pb-16"
				ref={gridRef}
				style={{ height: !isFullscreen ? gridHeight : "100%" }}
			>
				{isGridView &&
					(maximizedSource ? [maximizedSource] : remoteSources)
						.filter((x) => x.kind === "video")
						.map((x) => (
							<VoiceVideo
								onClick={maximizeSource}
								key={x.userId}
								consumerId={x.consumerId}
								producerId={x.producerId}
								gridElementWidth={gridSize?.elementWidth ?? 0}
								srcObject={x.srcObject}
							/>
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
						/>
					))}
			</div>
			<VoiceControlls
				isFullscreen={isFullscreen}
				isInVoice={voiceState.channelId === props.channelId}
				onConnect={connect}
				onDisconnect={disconnect}
				onScreenshare={screenshare}
				onToggleDeafen={toggleDeafen}
				onToggleFullscreen={toggleFullscreen}
				onToggleMute={toggleMute}
				voiceState={voiceState}
			/>
		</div>
	);
}
