import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import HuginnInput from "@components/input/HuginnInput";
import { useInputs } from "@hooks/useInputs";
import { useModals } from "@stores/modalsStore";
import { useSettings } from "@stores/settingsStore";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { DropdownItem, SettingsTabProps } from "@/types";

const hostnameModes: DropdownItem[] = [
	{ text: "Manual", value: "manual", icon: <IconMingcuteText2Fill className="size-6 text-text" /> },
	{ text: "External", value: "external", icon: <IconMingcuteWifiFill className="size-6 text-text" /> },
] as const;

export default function SettingsAdvancedTab(props: SettingsTabProps) {
	const settings = useSettings();

	const { values, validateValues, inputsProps, setValue } = useInputs([
		{ name: "apiHostname", required: false, default: settings.apiHostname },
		{ name: "cdnHostname", required: false, default: settings.cdnHostname },
		{ name: "voiceHostname", required: false, default: settings.voiceHostname },
		{ name: "externalUrl", required: false, default: settings.externalUrl },
	]);

	const [hostnameMode, setHostnameMode] = useState<typeof settings.hostnameMode>(settings.hostnameMode);
	const _hostnameMode = useRef(hostnameMode);
	const { updateModals } = useModals();

	function focusChanged(isFocused: boolean) {
		if (isFocused) {
			return;
		}

		const apiHostname = values.apiHostname.value;
		const cdnHostname = values.cdnHostname.value;
		const voiceHostname = values.voiceHostname.value;

		if (apiHostname.endsWith("/")) {
			setValue("apiHostname", apiHostname.slice(0, -1));
		}
		if (cdnHostname.endsWith("/")) {
			setValue("cdnAddress", cdnHostname.slice(0, -1));
		}
		if (voiceHostname.endsWith("/")) {
			setValue("voiceHostname", voiceHostname.slice(0, -1));
		}
	}

	function hostnameModeChanged(item: DropdownItem) {
		setHostnameMode(item.value as typeof settings.hostnameMode);
	}

	useEffect(() => {
		_hostnameMode.current = hostnameMode;
	}, [hostnameMode]);

	useEffect(() => {
		return () => {
			if (validateValues() && props.onChange) {
				if (
					(values.apiHostname.value && settings.apiHostname !== values.apiHostname.value) ||
					(values.cdnHostname.value && settings.cdnHostname !== values.cdnHostname.value) ||
					(values.voiceHostname.value && settings.voiceHostname !== values.voiceHostname.value) ||
					(values.externalUrl.value && settings.externalUrl !== values.externalUrl.value) ||
					_hostnameMode.current !== settings.hostnameMode
				) {
					updateModals({
						info: {
							isOpen: true,
							status: "info",
							text: "Server hostnames changed. The app should be restarted!",
							title: "Hang on!",
							action: {
								confirm: {
									text: "Restart",
									callback: async () => {
										settings.setSettings({
											cdnHostname: values.cdnHostname.value,
											apiHostname: values.apiHostname.value,
											voiceHostname: values.voiceHostname.value,
											externalUrl: values.externalUrl.value,
											hostnameMode: _hostnameMode.current,
										});
										await settings.saveSettings();
										updateModals({ info: { isOpen: false } });
										location.reload();
									},
								},
								cancel: {
									text: "Revert",
									callback: () => {
										updateModals({ info: { isOpen: false } });
									},
								},
							},
							closable: false,
						},
					});
				}
			}
		};
	}, []);

	return (
		<div className="flex flex-col gap-y-5">
			<HuginnDropdown onChange={hostnameModeChanged} defaultValue={hostnameModes.find((x) => x.value === hostnameMode)}>
				<HuginnDropdown.Label>Hostnames Mode</HuginnDropdown.Label>
				<HuginnDropdown.List>
					<HuginnDropdown.ItemsWrapper className="w-52">
						{hostnameModes.map((x) => (
							<HuginnDropdown.Item key={x.value} item={x} />
						))}
					</HuginnDropdown.ItemsWrapper>
				</HuginnDropdown.List>
			</HuginnDropdown>
			{hostnameMode === "manual" ? (
				<div>
					<div className="mb-2 select-none font-medium text-text text-xs uppercase opacity-90">Server Hostnames</div>
					<HuginnInput className="w-80" type="text" placeholder="API hostname" {...inputsProps.apiHostname} onFocusChanged={focusChanged}>
						<HuginnInput.Wrapper className="rounded-b-none">
							<InputTag>api</InputTag>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<HuginnInput className="mt-px w-80" type="text" placeholder="CDN hostname" {...inputsProps.cdnHostname} onFocusChanged={focusChanged}>
						<HuginnInput.Wrapper className="rounded-t-none rounded-b-none">
							<InputTag>cdn</InputTag>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<HuginnInput
						className="mt-px w-80"
						type="text"
						placeholder="Voice hostname"
						{...inputsProps.voiceHostname}
						onFocusChanged={focusChanged}
					>
						<HuginnInput.Wrapper className="rounded-t-none">
							<InputTag>voice</InputTag>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
				</div>
			) : (
				<div>
					<HuginnInput className="w-md" type="text" placeholder="External URL" {...inputsProps.externalUrl}>
						<HuginnInput.Label className="mb-2" text="External URL" />
						<div className="flex items-center">
							<HuginnInput.Wrapper>
								<HuginnInput.Input />
							</HuginnInput.Wrapper>
							{/* <HuginnButton className="bg-positive-500 ml-2 p-2">
								<IconMingcuteCheckFill />
							</HuginnButton> */}
						</div>
					</HuginnInput>
				</div>
			)}
		</div>
	);
}

function InputTag(props: { children?: ReactNode }) {
	return (
		<div className="ml-2 w-14 shrink-0 select-none rounded-sm bg-surface-deep p-1 px-1.5 text-center text-text text-xs uppercase">
			{props.children}
		</div>
	);
}
