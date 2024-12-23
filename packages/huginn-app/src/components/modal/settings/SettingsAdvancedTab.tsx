import type { DropboxItem, SettingsTabProps } from "@/types";
import { invoke } from "@tauri-apps/api/core";

const flavourItems: DropboxItem[] = [
	{ text: "Release", value: "release" },
	{ text: "Nightly", value: "nightly" },
];

export default function SettingsAdvancedTab(props: SettingsTabProps) {
	const huginnWindow = useHuginnWindow();

	const { values, validateValues, inputsProps } = useInputs([
		{ name: "serverAddress", required: false, default: props.settings.serverAddress },
		{ name: "cdnAddress", required: false, default: props.settings.cdnAddress },
	]);

	const [selectedFlavour, setSelectedFlavour] = useState(flavourItems.find((x) => x.value === huginnWindow.versionFlavour));

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

	function onFlavourChange(item: DropboxItem) {
		if (selectedFlavour?.value === item.value) {
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
							setSelectedFlavour(item);
							dispatch({ info: { isOpen: false } });

							const bc = new BroadcastChannel("huginn");
							bc.postMessage({ name: "restart_splashscreen", target: item.value });

							await invoke("open_splashscreen");
						},
					},
					cancel: {
						text: "Cancel",
						callback: () => {
							setSelectedFlavour(flavourItems.find((x) => x.value === huginnWindow.versionFlavour));
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
			{huginnWindow.environment === "desktop" && (
				<div>
					<HuginnDropdown forceSelected={selectedFlavour} onChange={onFlavourChange}>
						<HuginnDropdown.Label>App Flavour</HuginnDropdown.Label>
						<HuginnDropdown.List className="w-52">
							<HuginnDropdown.ItemsWrapper className="w-52">
								{flavourItems.map((x) => (
									<HuginnDropdown.Item item={x} key={x.value} />
								))}
							</HuginnDropdown.ItemsWrapper>
						</HuginnDropdown.List>
					</HuginnDropdown>
					<div className="mt-1 text-sm text-text/50 italic">*changing app flavour requires a reload.</div>
				</div>
			)}
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
