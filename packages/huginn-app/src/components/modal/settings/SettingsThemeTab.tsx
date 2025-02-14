import type { DropboxItem, SettingsTabProps, ThemeType } from "@/types";
import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import MockDefaultMessage from "@components/message/MockDefaultMessage";
import MockDefaultMessageCompact from "@components/message/MockDefaultMessageCompact";
import { pineGreenTheme, ceruleanTheme, eggplantTheme, coffeeTheme, charcoalTheme, useTheme } from "@stores/themeStore";
import clsx from "clsx";

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
	const { setTheme } = useTheme();

	function onThemeChange(item: DropboxItem) {
		setTheme(item.value as ThemeType);
		props.onChange?.({ theme: item.value as ThemeType });
	}

	function onChatModeChange(isCompact: boolean) {
		props.onChange?.({ chatMode: isCompact ? "compact" : "normal" });
	}

	return (
		<div className="flex flex-col gap-y-6">
			<HuginnDropdown onChange={onThemeChange} defaultValue={themes.find((x) => x.value === props.settings.theme)}>
				<HuginnDropdown.Label>Color Theme</HuginnDropdown.Label>
				<HuginnDropdown.List className="w-52">
					<HuginnDropdown.ItemsWrapper className="w-52">
						{themes.map((x) => (
							<HuginnDropdown.Item key={x.value} item={x} />
						))}
					</HuginnDropdown.ItemsWrapper>
				</HuginnDropdown.List>
			</HuginnDropdown>
			<div className="flex flex-col">
				<span className="mb-2 select-none font-medium text-text text-xs uppercase opacity-90">Chat Mode</span>
				<div className="flex gap-x-5">
					<CompactModeOption isSelected={props.settings.chatMode === "normal"} onChange={onChatModeChange} />
					<CompactModeOption representCompact isSelected={props.settings.chatMode === "compact"} onChange={onChatModeChange} />
				</div>
			</div>
		</div>
	);
}

function CompactModeOption(props: { isSelected?: boolean; representCompact?: boolean; onChange: (isCompact: boolean) => void }) {
	return (
		<button
			onClick={() => props.onChange(props.representCompact ?? false)}
			type="button"
			className={clsx(
				"flex flex-col justify-start overflow-hidden rounded-2xl border-2",
				props.isSelected ? "border-success/60" : "border-text/50",
			)}
		>
			<div className={clsx("w-full px-2 py-1 font-bold text-sm text-white", props.isSelected ? "bg-success/30" : "bg-secondary")}>
				{props.isSelected ? "SELECTED" : "NOT SELECTED"}
			</div>
			<div className="h-full bg-tertiary p-2">
				{props.representCompact ? (
					<>
						<MockDefaultMessageCompact self separate text="What a day..." />
						<MockDefaultMessageCompact self text="I got a Hammer but..." roundedTop={12} roundedBottom={12} />
						<MockDefaultMessageCompact self text="It's broken :(" roundedTop={0} end />
						<MockDefaultMessageCompact marginTop separate text="What a shame" />
						<MockDefaultMessageCompact text="Did it cost a lot of money?" roundedTop={12} roundedBottom={12} />
						<MockDefaultMessageCompact text="I can repair it!" roundedTop={0} end />
					</>
				) : (
					<>
						<MockDefaultMessage self separate text="What a day..." />
						<MockDefaultMessage self text="I got a Hammer but..." roundedTop={12} roundedBottom={12} />
						<MockDefaultMessage self text="It's broken :(" roundedTop={0} end />
						<MockDefaultMessage marginTop separate text="What a shame" />
						<MockDefaultMessage text="Did it cost a lot of money?" roundedTop={12} roundedBottom={12} />
						<MockDefaultMessage text="I can repair it!" roundedTop={0} end />
					</>
				)}
			</div>
		</button>
	);
}
