import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import { ScreenshareModalButton } from "@components/button/ScreenshareModalButton";
import DisplayPreview from "@components/DisplayPreview";
import LoadingIcon from "@components/LoadingIcon";
import { Checkbox, DialogPanel, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useClient } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import { voiceClient } from "@stores/voiceStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { DisplaySource } from "@/types";

export default function ScreenshareModal() {
	const client = useClient();
	const { screenshare: modal, updateModals } = useModals();
	const { data, isLoading, refetch } = useQuery({
		queryKey: ["display-sources"],
		queryFn: async () => await window.electronAPI.getDisplaySources(),
		enabled: modal.isOpen,
	});

	const [selectedSource, setSelectedSource] = useState<DisplaySource | undefined>();
	const [selectedQuality, setSelectedQuality] = useState(0);
	const [selectedFramerate, setSelectedFramerate] = useState(0);
	const [shareAudio, setShareAudio] = useState(false);
	const [screensharePending, startTransition] = useTransition();

	const screens = useMemo(() => data?.filter((x) => x.id.includes("screen")), [data]);
	const applications = useMemo(() => data?.filter((x) => x.id.includes("window")), [data]);

	useEffect(() => {
		if (modal.isOpen) {
			refetch();
		}
	}, [modal.isOpen]);

	useEffect(() => {
		if (!selectedSource) {
			setSelectedQuality(0);
			setSelectedFramerate(0);
		}
	}, [selectedSource]);

	function onSourceSelected(source: DisplaySource) {
		setSelectedSource(source);
	}

	function close() {
		updateModals({ screenshare: { isOpen: false } });
	}

	async function stream() {
		if (!selectedSource) {
			return;
		}

		window.electronAPI.setSelectedDisplaySource(selectedSource?.id);

		const framerate = selectedFramerate === 0 ? 15 : selectedFramerate === 1 ? 30 : selectedFramerate === 2 ? 60 : 15;
		const width = selectedQuality === 0 ? 640 : selectedQuality === 1 ? 1280 : selectedQuality === 2 ? 1920 : selectedQuality === 3 ? 2560 : 1280;
		const height = selectedQuality === 0 ? 480 : selectedQuality === 1 ? 720 : selectedQuality === 2 ? 1080 : selectedQuality === 3 ? 1440 : 720;

		startTransition(async () => {
			const producer = client.voice.producers.get("screen_video");
			producer?.track?.stop();

			await new Promise((r) => setTimeout(r, 1000));
			const stream = await navigator.mediaDevices.getDisplayMedia({
				audio: shareAudio,
				video: {
					frameRate: { ideal: framerate },
					width: { ideal: width },
					height: { ideal: height },
					aspectRatio: { ideal: 16 / 9 },
				},
			});

			// Reset loopback even if we want to start a new one / end the last one
			voiceClient.stopAudioLoopback();

			let audioTrack: MediaStreamTrack | undefined = stream.getAudioTracks()[0];
			if (!audioTrack && shareAudio) {
				audioTrack = voiceClient.getAudioTrackFromLoopback(selectedSource.name);
			}

			await client.voice.startScreensharing(stream.getVideoTracks()[0], audioTrack);
			close();
		});
	}

	return (
		<DialogPanel
			transition
			className="relative w-full max-w-lg transform select-none overflow-hidden rounded-xl border-2 border-primary-800 bg-surface py-5 pb-0 transition-[opacity_transform] duration-200 data-closed:scale-90"
		>
			<div className="flex flex-col gap-y-3 pb-5">
				<div className="text-center font-bold text-2xl text-text">Share Screen</div>
				<div className="px-2 text-center text-text/80">
					{selectedSource
						? "Choose a quality and framerate. The higher the quality, the higher the usage of internet"
						: "Choose a screen or a specific application to share with others"}
				</div>
				{!selectedSource ? (
					<TabGroup className="">
						<TabList className="mx-3 flex items-center justify-center gap-x-1 rounded-lg bg-surface-alt p-1 text-text">
							<Tab className="flex w-full cursor-pointer items-center justify-center gap-x-2 rounded-md py-1 text-text/80 hover:bg-primary-900/20 data-selected:bg-primary-900  data-selected:text-white">
								<IconMingcuteMonitorFill className="size-5" />
								<div>Screens</div>
							</Tab>
							<Tab className="flex w-full cursor-pointer items-center justify-center gap-x-2 rounded-md py-1 text-text/80 hover:bg-primary-900/20 data-selected:bg-primary-900  data-selected:text-white">
								<IconMingcuteWebFill className="size-5" />
								<div>Applications</div>
							</Tab>
						</TabList>
						<TabPanels className="scroll-alternative mt-3 h-80 overflow-x-hidden overflow-y-scroll px-5 py-1 pr-1.5">
							{isLoading ? (
								<div className="flex h-full w-full items-center justify-center">
									<LoadingIcon className="size-16" />
								</div>
							) : (
								<>
									<TabPanel className="grid grid-cols-2 gap-5">
										{screens?.map((x) => (
											<DisplayPreview key={x.id} source={x} onSelect={onSourceSelected} />
										))}
									</TabPanel>
									<TabPanel className="grid grid-cols-2 gap-5">
										{applications?.map((x) => (
											<DisplayPreview key={x.id} source={x} onSelect={onSourceSelected} />
										))}
									</TabPanel>
								</>
							)}
						</TabPanels>
					</TabGroup>
				) : (
					<div className="mx-5 mt-5 flex flex-col gap-y-4 rounded-lg border border-primary-700 p-5">
						<div className="flex flex-col gap-y-1.5 text-text">
							<div className="">Streaming</div>
							<div className="flex w-full items-center rounded-lg bg-surface-deep p-2 px-2">
								{selectedSource.id.includes("window") ? (
									<IconMingcuteWebFill className="mr-2 size-7 shrink-0 text-text/80" />
								) : (
									<IconMingcuteMonitorFill className="mr-2 size-7 shrink-0 text-text/80" />
								)}
								<div className="mr-2 overflow-hidden text-ellipsis whitespace-nowrap text-white">{selectedSource.name}</div>
								<button
									className="ml-auto shrink-0 rounded-md bg-surface px-3 py-1 text-sm transition-colors hover:bg-white/20"
									type="button"
									onClick={() => setSelectedSource(undefined)}
								>
									Change
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-y-1.5">
							<div className="text-text">Quality</div>
							<div className="flex w-max justify-center gap-x-1 overflow-hidden rounded-md bg-surface-deep p-1 text-sm">
								<ScreenshareModalButton onClick={() => setSelectedQuality(0)} selected={selectedQuality === 0}>
									480
								</ScreenshareModalButton>
								<div className="w-0.5 bg-white/10" />
								<ScreenshareModalButton onClick={() => setSelectedQuality(1)} selected={selectedQuality === 1}>
									720
								</ScreenshareModalButton>
								<div className="w-0.5 bg-white/10" />
								<ScreenshareModalButton onClick={() => setSelectedQuality(2)} selected={selectedQuality === 2}>
									1080
								</ScreenshareModalButton>
								<div className="w-0.5 bg-white/10" />
								<ScreenshareModalButton onClick={() => setSelectedQuality(3)} selected={selectedQuality === 3}>
									1440
								</ScreenshareModalButton>
							</div>
						</div>
						<div className="flex flex-col gap-y-1.5">
							<div className="text-text">Framerate</div>
							<div className="flex w-max justify-center gap-x-1 overflow-hidden rounded-md bg-surface-deep p-1 text-sm">
								<ScreenshareModalButton onClick={() => setSelectedFramerate(0)} selected={selectedFramerate === 0}>
									15
								</ScreenshareModalButton>
								<div className="w-0.5 bg-white/10" />
								<ScreenshareModalButton onClick={() => setSelectedFramerate(1)} selected={selectedFramerate === 1}>
									30
								</ScreenshareModalButton>
								<div className="w-0.5 bg-white/10" />
								<ScreenshareModalButton onClick={() => setSelectedFramerate(2)} selected={selectedFramerate === 2}>
									60
								</ScreenshareModalButton>
							</div>
						</div>
						<div className="mt-1 flex">
							<Checkbox
								checked={shareAudio}
								onChange={setShareAudio}
								className="group flex cursor-pointer items-center justify-center gap-x-2.5"
							>
								<div className="flex size-6 items-center justify-center rounded-md bg-surface-alt p-1 ring-1 ring-white/20 group-hover:bg-surface-deep group-data-checked:bg-primary-700 group-data-checked:ring-0">
									<IconMingcuteCheckFill className="text-white opacity-0 group-data-checked:opacity-100" />
								</div>
								<div className="text-text">Share Audio</div>
							</Checkbox>
						</div>
					</div>
				)}
			</div>
			<div className="flex w-full items-center gap-x-2 bg-surface-alt p-5">
				{selectedSource ? (
					<HuginnButton className="h-10 w-24" color="surface" onClick={() => setSelectedSource(undefined)}>
						Back
					</HuginnButton>
				) : (
					<HuginnButton className="h-10 w-24" color="surface" onClick={refetch}>
						Refresh
					</HuginnButton>
				)}
				<HuginnButton className="ml-auto h-10 w-20 decoration-white hover:underline" onClick={close}>
					Cancel
				</HuginnButton>
				<LoadingButton
					loading={screensharePending}
					className="h-10 w-24"
					color="primary"
					onClick={stream}
					disabled={selectedSource === undefined}
				>
					Go Live
				</LoadingButton>
			</div>
			<ModalCloseButton onClick={close} />
		</DialogPanel>
	);
}
