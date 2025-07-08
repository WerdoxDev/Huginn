import type { SettingsTabProps } from "@/types";
import HuginnInput from "@components/input/HuginnInput";
import { useInputs } from "@hooks/useInputs";
import { useModals } from "@stores/modalsStore";
import { useSettings } from "@stores/settingsStore";
import { useEffect } from "react";

export default function SettingsAdvancedTab(props: SettingsTabProps) {
	const settings = useSettings();

	const { values, validateValues, inputsProps, setValue } = useInputs([
		{ name: "serverAddress", required: false, default: settings.serverAddress },
		{ name: "cdnAddress", required: false, default: settings.cdnAddress },
		{ name: "voiceAddress", required: false, default: settings.voiceAddress },
	]);

	const { updateModals } = useModals();

	function focusChanged(isFocused: boolean) {
		if (isFocused) {
			return;
		}

		const serverAddress = values.serverAddress.value;
		const cdnAddress = values.cdnAddress.value;
		const voiceAddress = values.voiceAddress.value;

		if (serverAddress.endsWith("/")) {
			setValue("serverAddress", serverAddress.slice(0, -1));
		}
		if (cdnAddress.endsWith("/")) {
			setValue("cdnAddress", cdnAddress.slice(0, -1));
		}
		if (voiceAddress.endsWith("/")) {
			setValue("voiceAddress", voiceAddress.slice(0, -1));
		}
	}

	useEffect(() => {
		return () => {
			if (validateValues() && props.onChange) {
				if (
					(values.serverAddress.value && settings.serverAddress !== values.serverAddress.value) ||
					(values.cdnAddress.value && settings.cdnAddress !== values.cdnAddress.value) ||
					(values.voiceAddress.value && settings.voiceAddress !== values.voiceAddress.value)
				) {
					updateModals({
						info: {
							isOpen: true,
							status: "info",
							text: "Server or CDN or Voice address changed. The app should be restarted!",
							title: "Hang on!",
							action: {
								confirm: {
									text: "Restart",
									callback: async () => {
										settings.setSettings({
											cdnAddress: values.cdnAddress.value,
											serverAddress: values.serverAddress.value,
											voiceAddress: values.voiceAddress.value,
										});
										await settings.saveSettings();
										updateModals({ info: { isOpen: false } });
										location.reload();
									},
								},
								cancel: {
									text: "Revert",
									callback: () => {
										// currentSettings.current = { ...settingsStore.getState() };
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
		<div className="flex flex-col gap-y-10">
			<div className="flex flex-col gap-y-5">
				<div>
					<HuginnInput className="w-72" type="text" {...inputsProps.serverAddress} onFocusChanged={focusChanged}>
						<HuginnInput.Label text="Server Address" className="mb-2" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<div className="mt-1 text-sm text-text/50 italic">*changing server address requires a reload.</div>
				</div>
				<div>
					<HuginnInput className="w-72" type="text" {...inputsProps.cdnAddress} onFocusChanged={focusChanged}>
						<HuginnInput.Label text="CDN Address" className="mb-2" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<div className="mt-1 text-sm text-text/50 italic">*changing cdn address requires a reload.</div>
				</div>
				<div>
					<HuginnInput className="w-72" type="text" {...inputsProps.voiceAddress} onFocusChanged={focusChanged}>
						<HuginnInput.Label text="Voice Address" className="mb-2" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<div className="mt-1 text-sm text-text/50 italic">*changing voice address requires a reload.</div>
				</div>
			</div>
		</div>
	);
}
