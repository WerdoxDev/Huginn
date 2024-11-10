import type { DropboxItem, SettingsTabProps, ThemeType } from "@/types";

function ThemeIcon(props: { color: string }) {
	return <div className="h-6 w-6 rounded-md" style={{ background: props.color }} />;
}

const themes: DropboxItem[] = [
	{ text: "Pine Green", value: "pine green", icon: <ThemeIcon color={pineGreenTheme.primary} /> },
	{ text: "Cerulean", value: "cerulean", icon: <ThemeIcon color={ceruleanTheme.primary} /> },
	{ text: "Eggplant", value: "eggplant", icon: <ThemeIcon color={eggplantTheme.primary} /> },
	{ text: "Coffee", value: "coffee", icon: <ThemeIcon color={coffeeTheme.primary} /> },
	{ text: "Charcoal", value: "charcoal", icon: <ThemeIcon color={charcoalTheme.primary} /> },
];

export default function SettingsThemeTab(props: SettingsTabProps) {
	const themeDispatch = useThemeDispather();

	function onChange(item: DropboxItem) {
		themeDispatch(item.value as ThemeType);
		props.onChange?.({ theme: item.value as ThemeType });
	}

	return (
		<HuginnDropdown onChange={onChange} defaultValue={themes.find((x) => x.value === props.settings.theme)}>
			<HuginnDropdown.Label>Color Theme</HuginnDropdown.Label>
			<HuginnDropdown.List className="w-52">
				<HuginnDropdown.ItemsWrapper className="w-52">
					{themes.map((x) => (
						<HuginnDropdown.Item key={x.value} item={x} />
					))}
				</HuginnDropdown.ItemsWrapper>
			</HuginnDropdown.List>
		</HuginnDropdown>
	);
}
