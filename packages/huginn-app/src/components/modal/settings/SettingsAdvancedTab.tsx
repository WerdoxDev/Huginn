import type { DropboxItem, SettingsTabProps } from "@/types";
import HuginnDropbox from "@components/HuginnDropbox";
import HuginnInput from "@components/input/HuginnInput";
import { useModalsDispatch } from "@contexts/modalContext";
import { useInputs } from "@hooks/useInputs";
import { useEffect, useState } from "react";
import { relaunch } from "@tauri-apps/plugin-process";

const flavourItems: DropboxItem[] = [
	{ id: 0, name: "Release", value: "release" },
	{ id: 1, name: "Nightly", value: "nightly" },
];

export default function SettingsAdvancedTab(props: SettingsTabProps) {
	const { values, validateValues, inputsProps } = useInputs([
		{ name: "serverAddress", required: false, default: props.settings.serverAddress },
		{ name: "cdnAddress", required: false, default: props.settings.cdnAddress },
	]);

	const [selectedFlavour, setSelectedFlavour] = useState(flavourItems.find((x) => x.value === props.settings.flavour));

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
		if (props.settings.flavour !== value.value) {
			dispatch({
				info: {
					isOpen: true,
					status: "default",
					text: "Changing App flavour requires a restart to download the new version.",
					title: "Hang on!",
					action: {
						confirm: {
							text: "Restart",
							callback: async () => {
								setSelectedFlavour(value);
								props.onChange?.({ flavour: (value.value as "release" | "nightly") ?? "release" });
								await props.onSave?.();
								dispatch({ info: { isOpen: false } });
								await relaunch();
							},
						},
						cancel: {
							text: "Cancel",
							callback: () => {
								setSelectedFlavour(flavourItems.find((x) => x.value === props.settings.flavour) ?? flavourItems[0]);
								dispatch({ info: { isOpen: false } });
							},
						},
					},
					closable: false,
				},
			});
		}
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
