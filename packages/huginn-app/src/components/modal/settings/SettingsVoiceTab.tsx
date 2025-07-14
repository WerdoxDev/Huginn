import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import GenericLabel from "@components/input/GenericLabel";
import RangeInput from "@components/input/RangeInput";
import { Checkbox, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { remap } from "@huginn/shared";
import { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import { VoiceInputDevice } from "@lib/voice/voice-input-device";
import { useSettings } from "@stores/settingsStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DropdownItem, SettingsTabProps } from "@/types";

export default function SettingsVoiceTab(props: SettingsTabProps) {
	const { data } = useQuery({ queryFn: async () => await navigator.mediaDevices.enumerateDevices(), queryKey: ["media-devices"] });
	const settings = useSettings();

	const inputDevices = useMemo(() => data?.filter((x) => x.kind === "audioinput"), [data]);
	const outputDevices = useMemo(() => data?.filter((x) => x.kind === "audiooutput"), [data]);
	const audioLevel = useRef<AudioLevelChecker>(null);
	const inputDevice = useRef<VoiceInputDevice>(null);
	const _inputDb = useRef(0);

	const [inputDb, setInputDb] = useState(0);

	const [selectedInput, setSelectedInput] = useState<MediaDeviceInfo>();
	const [selectedOutput, setSelectedOutput] = useState<MediaDeviceInfo>();
	const [noiseSuppression, setNoiseSuppression] = useState(settings.noiseSuppression);

	useEffect(() => {
		let cancelled = false;
		async function runAudioChecker() {
			if (!selectedInput) {
				return;
			}

			if (!inputDevice.current) {
				inputDevice.current = new VoiceInputDevice();
			}

			audioLevel.current = new AudioLevelChecker();
			const stream = await inputDevice.current.getStream(selectedInput?.deviceId, settings.inputVolume, noiseSuppression);
			// This is an async function so the component will probably unmount before it knows
			if (cancelled) {
				return;
			}

			audioLevel.current.startChecking(stream);
			audioLevel.current.offAll("audio-level");
			audioLevel.current.on("audio-level", onAudioLevel);
		}
		runAudioChecker();

		const interval = setInterval(() => {
			setInputDb(_inputDb.current);
		}, 100);

		return () => {
			cancelled = true;
			clearInterval(interval);
			audioLevel.current?.stopChecking();
			audioLevel.current?.off("audio-level", onAudioLevel);
		};
	}, [selectedInput, noiseSuppression]);

	useEffect(() => {
		inputDevice.current?.setGain(settings.inputVolume);
	}, [settings.inputVolume]);

	useEffect(() => {
		if (!data || !inputDevices || !outputDevices) {
			return;
		}

		setSelectedInput(inputDevices?.find((x) => x.deviceId === settings.inputDeviceId) ?? inputDevices[0]);
		setSelectedOutput(outputDevices?.find((x) => x.deviceId === settings.outputDeviceId) ?? outputDevices[0]);
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

	useEffect(() => {
		props.onChange?.({ noiseSuppression: noiseSuppression });
	}, [noiseSuppression]);

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

	if (!selectedInput || !selectedOutput) {
		return;
	}

	return (
		<div className="flex flex-col">
			<TabGroup>
				<TabList className="flex w-max items-center justify-center gap-x-1 rounded-lg bg-surface-alt p-1 text-text">
					<Tab className="flex cursor-pointer items-center justify-center gap-x-2 rounded-md px-5 py-1 text-text/80 hover:bg-primary-900/20 data-selected:bg-primary-900 data-selected:text-white">
						<IconMingcuteVolumeFill className="size-5" />
						<div>Audio</div>
					</Tab>
					<Tab className="flex cursor-pointer items-center justify-center gap-x-2 rounded-md px-5 py-1 text-text/80 hover:bg-primary-900/20 data-selected:bg-primary-900 data-selected:text-white">
						<IconMingcuteCamera2Fill className="size-5" />
						<div>Video</div>
					</Tab>
				</TabList>
				<TabPanels className="mt-5">
					<TabPanel>
						<div className="flex gap-x-5">
							<HuginnDropdown
								className="w-full max-w-xs"
								onChange={onInputChange}
								defaultValue={selectedInput ? { text: selectedInput?.label, value: selectedInput?.deviceId } : undefined}
							>
								<HuginnDropdown.Label>Input Device</HuginnDropdown.Label>
								<HuginnDropdown.List className="w-full">
									<HuginnDropdown.ItemsWrapper className="scroll-alternative2 overflow-y-scroll! w-80 pr-0">
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
									<HuginnDropdown.ItemsWrapper className="scroll-alternative2 overflow-y-scroll! w-80 pr-0">
										{outputDevices?.map((x) => (
											<HuginnDropdown.Item key={x.deviceId} item={{ text: x.label, value: x.deviceId }} />
										))}
									</HuginnDropdown.ItemsWrapper>
								</HuginnDropdown.List>
							</HuginnDropdown>
						</div>
						<div className="mt-5 flex gap-x-5">
							<div className="w-full max-w-xs">
								<GenericLabel>Input Volume</GenericLabel>
								<RangeInput onChange={onInputVolumeChange} defaultValue={settings.inputVolume} />
							</div>
							<div className="w-full max-w-xs">
								<GenericLabel>Output Volume</GenericLabel>
								<RangeInput onChange={onOutputVolumeChange} defaultValue={settings.outputVolume} maxValue={200} />
							</div>
						</div>
						<div className="mt-5 flex">
							<div className="w-full max-w-165">
								<GenericLabel>Input Threshold</GenericLabel>
								<RangeInput
									onChange={onInputThresholdChange}
									backgroundClassName="!bg-positive-400"
									fillClassName="!bg-negative-100"
									defaultValue={remap(settings.inputThreshold ?? -100, -100, 0, 0, 100)}
									getTooltipText={(percentage) => `${remap(percentage, 0, 100, -100, 0)}db`}
								>
									<div
										className="absolute top-0 left-0 h-full bg-surface-alt/50 transition-all duration-100"
										style={{ width: `${remap(inputDb, -100, 0, 0, 100)}%` }}
									/>
								</RangeInput>
							</div>
						</div>
						<div className="mt-5 flex">
							<Checkbox
								checked={noiseSuppression}
								onChange={setNoiseSuppression}
								className="group flex cursor-pointer items-center justify-center gap-x-2.5"
							>
								<div className="flex size-6 items-center justify-center rounded-md bg-surface-alt p-1 ring-1 ring-white/20 group-hover:bg-surface-deep group-data-checked:bg-primary-700 group-data-checked:ring-0">
									<IconMingcuteCheckFill className="text-white opacity-0 group-data-checked:opacity-100" />
								</div>
								<div className="text-text">Noise Suppression</div>
							</Checkbox>
						</div>
					</TabPanel>
					<TabPanel>HI </TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
