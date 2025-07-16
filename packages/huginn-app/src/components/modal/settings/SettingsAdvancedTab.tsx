import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import HuginnInput from "@components/input/HuginnInput";
import { useInputs } from "@hooks/useInputs";
import { useModals } from "@stores/modalsStore";
import { useSettings } from "@stores/settingsStore";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { DropdownItem, SettingsTabProps } from "@/types";

const hostnameSources: DropdownItem[] = [
	{ text: "Manual", value: "manual", icon: <IconMingcuteText2Fill className="size-6 text-text" /> },
	{ text: "External", value: "external", icon: <IconMingcuteWifiFill className="size-6 text-text" /> },
] as const;

export default function SettingsAdvancedTab(props: SettingsTabProps) {
	const settings = useSettings();

	const { values, validateValues, inputsProps, setValue } = useInputs([
		{ name: "apiHostname", required: false, default: settings.apiHostname },
		{ name: "cdnHostname", required: false, default: settings.cdnHostname },
		{ name: "voiceHostname", required: false, default: settings.voiceHostname },
		{ name: "externalUrl", required: false, default: settings.externalHostnamesUrl },
	]);

	const [hostnameSource, setHostnameMode] = useState<typeof settings.hostnameSource>(settings.hostnameSource);
	const _hostnameSource = useRef(hostnameSource);
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
			setValue("cdnHostname", cdnHostname.slice(0, -1));
		}
		if (voiceHostname.endsWith("/")) {
			setValue("voiceHostname", voiceHostname.slice(0, -1));
		}
	}

	function hostnameModeChanged(item: DropdownItem) {
		setHostnameMode(item.value as typeof settings.hostnameSource);
	}

	useEffect(() => {
		_hostnameSource.current = hostnameSource;
	}, [hostnameSource]);

	useEffect(() => {
		return () => {
			if (validateValues() && props.onChange) {
				if (
					(values.apiHostname.value && settings.apiHostname !== values.apiHostname.value) ||
					(values.cdnHostname.value && settings.cdnHostname !== values.cdnHostname.value) ||
					(values.voiceHostname.value && settings.voiceHostname !== values.voiceHostname.value) ||
					(values.externalUrl.value && settings.externalHostnamesUrl !== values.externalUrl.value) ||
					_hostnameSource.current !== settings.hostnameSource
				) {
					updateModals({
						info: {
							isOpen: true,
							status: "info",
							text: "Hostnames changed. The app should be restarted!",
							title: "Hang on!",
							action: {
								confirm: {
									text: "Restart",
									callback: async () => {
										settings.setSettings({
											cdnHostname: values.cdnHostname.value,
											apiHostname: values.apiHostname.value,
											voiceHostname: values.voiceHostname.value,
											externalHostnamesUrl: values.externalUrl.value,
											hostnameSource: _hostnameSource.current,
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
			<HuginnDropdown onChange={hostnameModeChanged} defaultValue={hostnameSources.find((x) => x.value === hostnameSource)}>
				<HuginnDropdown.Label>Hostname Source</HuginnDropdown.Label>
				<HuginnDropdown.List>
					<HuginnDropdown.ItemsWrapper className="w-52">
						{hostnameSources.map((x) => (
							<HuginnDropdown.Item key={x.value} item={x} />
						))}
					</HuginnDropdown.ItemsWrapper>
				</HuginnDropdown.List>
			</HuginnDropdown>
			{hostnameSource === "manual" ? (
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
					<HuginnInput className="w-md" type="text" placeholder="External Hostnames URL" {...inputsProps.externalUrl}>
						<HuginnInput.Label className="mb-2" text="External Hostnames URL" />
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
