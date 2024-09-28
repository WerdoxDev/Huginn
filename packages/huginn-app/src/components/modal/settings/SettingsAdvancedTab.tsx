import type { DropboxItem, SettingsTabProps, VersionFlavour } from "@/types";
import HuginnDropbox from "@components/HuginnDropbox";
import HuginnInput from "@components/input/HuginnInput";
import { useModalsDispatch } from "@contexts/modalContext";
import { useWindow, useWindowDispatch } from "@contexts/windowContext";
import { useInputs } from "@hooks/useInputs";
import { getVersionFlavour } from "@lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { useEffect, useState } from "react";

const flavourItems: DropboxItem[] = [
	{ id: 0, name: "Release", value: "release" },
	{ id: 1, name: "Nightly", value: "nightly" },
];

export default function SettingsAdvancedTab(props: SettingsTabProps) {
	const appWindow = useWindow();
	const appWindowDispatch = useWindowDispatch();

	const { values, validateValues, inputsProps } = useInputs([
		{ name: "serverAddress", required: false, default: props.settings.serverAddress },
		{ name: "cdnAddress", required: false, default: props.settings.cdnAddress },
	]);

	const [selectedFlavour, setSelectedFlavour] = useState(flavourItems.find((x) => x.value === appWindow.versionFlavour));

	const dispatch = useModalsDispatch();

	useEffect(() => {
		if (validateValues() && props.onChange) {
			if (props.settings.serverAddress !== values.serverAddress.value) {
				props.onChange({ serverAddress: values.serverAddress.value });
			}
			if (props.settings.cdnAddress !== values.cdnAddress.value) {
				props.onChange({ cdnAddress: values.cdnAddress.value });
			}
		}
	}, [values]);

	function onFlavourChange(value: DropboxItem) {
		if (selectedFlavour?.id === value.id) {
			return;
		}

		dispatch({
			info: {
				isOpen: true,
				status: "default",
				text: "Changing App flavour requires a reload to download the new version.",
				title: "Hang on!",
				action: {
					confirm: {
						text: "Restart",
						callback: async () => {
							setSelectedFlavour(value);
							dispatch({ info: { isOpen: false } });

							const bc = new BroadcastChannel("huginn");
							bc.postMessage({ name: "restart_splashscreen", target: value.value });

							await invoke("open_splashscreen");
						},
					},
					cancel: {
						text: "Cancel",
						callback: () => {
							setSelectedFlavour(flavourItems.find((x) => x.value === appWindow.versionFlavour));
							dispatch({ info: { isOpen: false } });
						},
					},
				},
				closable: false,
			},
		});
	}

	return (
		<div className="flex flex-col gap-y-10">
			<div>
				<HuginnDropbox selected={selectedFlavour} onChange={onFlavourChange} items={flavourItems}>
					<HuginnDropbox.Label>App Flavour</HuginnDropbox.Label>
				</HuginnDropbox>
				<div className="text-text/50 mt-1 text-sm italic">*changing app flavour requires a reload.</div>
			</div>
			<div className="flex flex-col gap-y-5">
				<div>
					<HuginnInput className="w-72" type="text" {...inputsProps.serverAddress}>
						<HuginnInput.Label text="Server Address" className="mb-2" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<div className="text-text/50 mt-1 text-sm italic">*changing server address requires a reload.</div>
				</div>
				<div>
					<HuginnInput className="w-72" type="text" {...inputsProps.cdnAddress}>
						<HuginnInput.Label text="CDN Address" className="mb-2" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<div className="text-text/50 mt-1 text-sm italic">*changing cdn address requires a reload.</div>
				</div>
			</div>
		</div>
	);
}
