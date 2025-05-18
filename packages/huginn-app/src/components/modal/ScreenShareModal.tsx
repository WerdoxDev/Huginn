import type { DisplaySource } from "@/types";
import DisplayPreview from "@components/DisplayPreview";
import LoadingIcon from "@components/LoadingIcon";
import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import { DialogPanel, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useClient } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import { useVoiceStore } from "@stores/voiceStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useMemo, useState, useTransition } from "react";

export default function ScreenShareModal() {
	const client = useClient();
	const { screenshare: modal, updateModals } = useModals();
	const { voiceState } = useVoiceStore();
	const { data, isLoading } = useQuery({
		queryKey: ["display-sources"],
		queryFn: async () => await window.electronAPI.getDisplaySources(),
	});

	const [selectedSource, setSelectedSource] = useState<DisplaySource | undefined>();
	const [selectedQuality, setSelectedQuality] = useState(0);
	const [selectedFramerate, setSelectedFramerate] = useState(0);
	const [screensharePending, startTransition] = useTransition();

	const screens = useMemo(() => data?.filter((x) => x.id.includes("screen")), [data]);
	const applications = useMemo(() => data?.filter((x) => x.id.includes("window")), [data]);

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
		const height = selectedQuality === 0 ? 480 : selectedQuality === 1 ? 720 : selectedQuality === 2 ? 1080 : selectedQuality === 3 ? 2560 : 1440;

		startTransition(async () => {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				audio: true,
				video: { frameRate: framerate, width, height, aspectRatio: 16 / 9 },
			});
			await client.voice.startScreenSharing(stream.getVideoTracks()[0], stream.getAudioTracks()[0]);

			client.gateway.updateVoiceState(voiceState.selfDeaf, voiceState.selfDeaf, true, voiceState.selfVideo);
			close();
		});
	}

	return (
		<DialogPanel
			transition
			className="w-full max-w-md transform overflow-hidden rounded-xl border-2 border-primary/50 bg-background py-5 pb-0 transition-[opacity_transform] duration-200 data-[closed]:scale-90"
		>
			<div className="flex flex-col gap-y-3 pb-5">
				<div className="text-center font-bold text-2xl text-text">Share Screen</div>
				<div className="px-2 text-center text-text/80">
					{selectedSource
						? "Choose a quality and framerate. The higher the quality, the higher the usage of internet"
						: "Choose a screen or a specific application to share with others"}
				</div>
				{!selectedSource ? (
					<TabGroup className="mt-5">
						<TabList className="flex justify-center gap-x-10 text-text">
							<Tab className="flex w-40 flex-col gap-y-3 text-text/80 data-[selected]:text-white">
								{({ selected }) => (
									<>
										<div>Screens</div>
										<div className={clsx("h-0.5", selected && "bg-white")} />
									</>
								)}
							</Tab>
							<Tab className="flex w-40 flex-col gap-y-3 text-text/80 data-[selected]:text-white">
								{({ selected }) => (
									<>
										<div>Applications</div>
										<div className={clsx("h-0.5", selected && "bg-white")} />
									</>
								)}
							</Tab>
						</TabList>
						<TabPanels className="scroll-alternative h-80 overflow-x-hidden overflow-y-scroll px-5 py-4 pr-1.5">
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
					<div className="mx-5 mt-5 flex flex-col gap-y-4 rounded-lg border border-primary p-5">
						<div className="flex flex-col gap-y-1.5 text-text">
							<div className="">Streaming</div>
							<div className="flex w-full items-center rounded-lg bg-tertiary p-2 px-2">
								{selectedSource.id.includes("window") ? (
									<IconMingcuteWebFill className="mr-2 size-7 shrink-0 text-text/80" />
								) : (
									<IconMingcuteMonitorFill className="mr-2 size-7 shrink-0 text-text/80" />
								)}
								<div className="mr-2 overflow-hidden text-ellipsis whitespace-nowrap text-white">{selectedSource.name}</div>
								<button
									className="ml-auto shrink-0 rounded-md bg-background px-3 py-1 text-sm transition-colors hover:bg-white/20"
									type="button"
									onClick={() => setSelectedSource(undefined)}
								>
									Change
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-y-1.5">
							<div className="text-text">Quality</div>
							<div className="flex w-max justify-center gap-x-1 overflow-hidden rounded-md bg-tertiary p-1 text-sm">
								<button
									onClick={() => setSelectedQuality(0)}
									className={clsx(
										"rounded-sm px-2 py-1",
										selectedQuality === 0 ? "bg-primary text-text" : "text-text/80 hover:bg-primary/70",
									)}
									type="button"
								>
									480
								</button>
								<div className="w-0.5 bg-white/10" />
								<button
									onClick={() => setSelectedQuality(1)}
									className={clsx(
										"rounded-sm px-2 py-1",
										selectedQuality === 1 ? "bg-primary text-text" : "text-text/80 hover:bg-primary/70",
									)}
									type="button"
								>
									720
								</button>
								<div className="w-0.5 bg-white/10" />
								<button
									onClick={() => setSelectedQuality(2)}
									className={clsx(
										"rounded-sm px-2 py-1",
										selectedQuality === 2 ? "bg-primary text-text" : "text-text/80 hover:bg-primary/70",
									)}
									type="button"
								>
									1080
								</button>
								<div className="w-0.5 bg-white/10" />
								<button
									onClick={() => setSelectedQuality(3)}
									className={clsx(
										"rounded-sm px-2 py-1",
										selectedQuality === 3 ? "bg-primary text-text" : "text-text/80 hover:bg-primary/70",
									)}
									type="button"
								>
									1440
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-y-1.5">
							<div className="text-text">Framerate</div>
							<div className="flex w-max justify-center gap-x-1 overflow-hidden rounded-md bg-tertiary p-1 text-sm">
								<button
									onClick={() => setSelectedFramerate(0)}
									className={clsx(
										"rounded-sm px-2 py-1",
										selectedFramerate === 0 ? "bg-primary text-text" : "text-text/80 hover:bg-primary/70",
									)}
									type="button"
								>
									15
								</button>
								<div className="w-0.5 bg-white/10" />
								<button
									onClick={() => setSelectedFramerate(1)}
									className={clsx(
										"rounded-sm px-2 py-1",
										selectedFramerate === 1 ? "bg-primary text-text" : "text-text/80 hover:bg-primary/70",
									)}
									type="button"
								>
									30
								</button>
								<div className="w-0.5 bg-white/10" />
								<button
									onClick={() => setSelectedFramerate(2)}
									className={clsx(
										"rounded-sm px-2 py-1",
										selectedFramerate === 2 ? "bg-primary text-text" : "text-text/80 hover:bg-primary/70",
									)}
									type="button"
								>
									60
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
			<div className="flex w-full items-center gap-x-2 bg-secondary p-5">
				{selectedSource && (
					<HuginnButton className="h-10 w-24 bg-background" onClick={() => setSelectedSource(undefined)}>
						Back
					</HuginnButton>
				)}
				<HuginnButton className="ml-auto h-10 w-20 decoration-white hover:underline" onClick={close}>
					Cancel
				</HuginnButton>
				<LoadingButton loading={screensharePending} className="h-10 w-24 bg-primary" onClick={stream} disabled={selectedSource === undefined}>
					Go Live
				</LoadingButton>
			</div>
			<ModalCloseButton onClick={close} />
		</DialogPanel>
	);
}
