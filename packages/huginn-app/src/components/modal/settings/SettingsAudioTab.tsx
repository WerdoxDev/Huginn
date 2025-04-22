import type { DropdownItem, SettingsTabProps } from "@/types";
import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import GenericLabel from "@components/input/GenericLabel";
import RangeInput from "@components/input/RangeInput";
import { remap } from "@huginn/shared";
import { AudioLevelChecker, getInputStream } from "@lib/voice-client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

export default function SettingsAudioTab(props: SettingsTabProps) {
	const { data } = useQuery({ queryFn: async () => await navigator.mediaDevices.enumerateDevices(), queryKey: ["media-devices"] });

	const inputDevices = useMemo(() => data?.filter((x) => x.kind === "audioinput"), [data]);
	const outputDevices = useMemo(() => data?.filter((x) => x.kind === "audiooutput"), [data]);
	const _inputDb = useRef(0);

	const [inputDb, setInputDb] = useState(0);

	const [selectedInput, setSelectedInput] = useState<MediaDeviceInfo>();
	const [selectedOutput, setSelectedOutput] = useState<MediaDeviceInfo>();

	useEffect(() => {
		let audioLevel: AudioLevelChecker;

		async function runAudioChecker() {
			audioLevel = new AudioLevelChecker();
			const stream = await getInputStream();
			audioLevel.startChecking(stream, props.settings.inputVolume ?? 1);
			audioLevel.on("audio-level", onAudioLevel);
		}
		runAudioChecker();

		const interval = setInterval(() => {
			setInputDb(_inputDb.current);
		}, 100);

		return () => {
			audioLevel.stopChecking();
			audioLevel.off("audio-level", onAudioLevel);
			clearInterval(interval);
		};
	}, [selectedInput]);

	useEffect(() => {
		if (!data || !inputDevices || !outputDevices) {
			return;
		}

		setSelectedInput(inputDevices?.find((x) => x.deviceId === props.settings.inputDeviceId) ?? inputDevices[0]);
		setSelectedOutput(outputDevices?.find((x) => x.deviceId === props.settings.outputDeviceId) ?? outputDevices[0]);
	}, [data]);

	useEffect(() => {
		if (selectedInput) {
			props.onChange?.({ inputDeviceId: selectedInput?.deviceId });
		}
	}, [selectedInput]);

	useEffect(() => {
		if (selectedOutput) {
			props.onChange?.({ outputDeviceId: selectedOutput?.deviceId });
		}
	}, [selectedOutput]);

	function onAudioLevel(db: number) {
		_inputDb.current = db;
	}

	function onInputChange(value: DropdownItem) {
		setSelectedInput(inputDevices?.find((x) => x.deviceId === value.value));
	}

	function onOutputChange(value: DropdownItem) {
		setSelectedOutput(outputDevices?.find((x) => x.deviceId === value.value));
	}

	function onInputVolumeChange(value: number) {
		props.onChange?.({ inputVolume: value });
	}

	function onOutputVolumeChange(value: number) {
		props.onChange?.({ outputVolume: value });
	}

	function onInputThresholdChange(value: number) {
		props.onChange?.({ inputThreshold: value - 100 });
	}

	if (!data) {
		return;
	}

	return (
		<div className="flex flex-col">
			<div className="flex gap-x-5">
				<HuginnDropdown
					className="w-full max-w-xs"
					onChange={onInputChange}
					defaultValue={selectedInput ? { text: selectedInput?.label, value: selectedInput?.deviceId } : undefined}
				>
					<HuginnDropdown.Label>Input Device</HuginnDropdown.Label>
					<HuginnDropdown.List className="w-full">
						<HuginnDropdown.ItemsWrapper className="scroll-alternative2 !overflow-y-scroll w-80 pr-0">
							{inputDevices?.map((x) => (
								<HuginnDropdown.Item key={x.deviceId} item={{ text: x.label, value: x.deviceId }} />
							))}
						</HuginnDropdown.ItemsWrapper>
					</HuginnDropdown.List>
				</HuginnDropdown>
				<HuginnDropdown
					className="w-full max-w-xs"
					onChange={onOutputChange}
					defaultValue={selectedOutput ? { text: selectedOutput?.label, value: selectedOutput?.deviceId } : undefined}
				>
					<HuginnDropdown.Label>Output Device</HuginnDropdown.Label>
					<HuginnDropdown.List className="w-full">
						<HuginnDropdown.ItemsWrapper className="scroll-alternative2 !overflow-y-scroll w-80 pr-0">
							{outputDevices?.map((x) => (
								<HuginnDropdown.Item key={x.deviceId} item={{ text: x.label, value: x.deviceId }} />
							))}
						</HuginnDropdown.ItemsWrapper>
					</HuginnDropdown.List>
				</HuginnDropdown>
			</div>
			<div className="mt-8 flex gap-x-5">
				<div className="w-full max-w-xs">
					<GenericLabel>Input Volume</GenericLabel>
					<RangeInput onChange={onInputVolumeChange} defaultValue={props.settings.inputVolume} />
				</div>
				<div className="w-full max-w-xs">
					<GenericLabel>Output Volume</GenericLabel>
					<RangeInput onChange={onOutputVolumeChange} defaultValue={props.settings.outputVolume} maxValue={200} />
				</div>
			</div>
			<div className="mt-8 flex">
				<div className="w-full max-w-[41.25rem]">
					<GenericLabel>Input Threshold</GenericLabel>
					<RangeInput
						onChange={onInputThresholdChange}
						backgroundClassName="bg-success/50"
						fillClassName="bg-error"
						defaultValue={remap(props.settings.inputThreshold ?? -100, -100, 0, 0, 100)}
						getTooltipText={(percentage) => `${remap(percentage, 0, 100, -100, 0)}db`}
					>
						<div
							className="absolute top-0 left-0 h-full bg-secondary/50 transition-all duration-100"
							style={{ width: `${remap(inputDb, -100, 0, 0, 100)}%` }}
						/>
					</RangeInput>
				</div>
			</div>
		</div>
	);
}
