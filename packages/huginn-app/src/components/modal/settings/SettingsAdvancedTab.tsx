import type { SettingsTabProps } from "@/types";

export default function SettingsAdvancedTab(props: SettingsTabProps) {
	const { values, validateValues, inputsProps } = useInputs([
		{ name: "serverAddress", required: false, default: props.settings.serverAddress },
		{ name: "cdnAddress", required: false, default: props.settings.cdnAddress },
	]);

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

	return (
		<div className="flex flex-col gap-y-10">
			<div className="flex flex-col gap-y-5">
				<div>
					<HuginnInput className="w-72" type="text" {...inputsProps.serverAddress}>
						<HuginnInput.Label text="Server Address" className="mb-2" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<div className="mt-1 text-sm text-text/50 italic">*changing server address requires a reload.</div>
				</div>
				<div>
					<HuginnInput className="w-72" type="text" {...inputsProps.cdnAddress}>
						<HuginnInput.Label text="CDN Address" className="mb-2" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<div className="mt-1 text-sm text-text/50 italic">*changing cdn address requires a reload.</div>
				</div>
			</div>
		</div>
	);
}
