import ModalCloseButton from "@components/button/ModalCloseButton";
import { DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import type { DeepPartial } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { settingsStore, useSettings } from "@stores/settingsStore";
import clsx from "clsx";
// import { usePostHog } from "posthog-js/react";
import { Fragment, memo, useEffect, useRef, useState } from "react";
import type { AppSettings, SettingsTab, SettingsTabProps } from "@/types";
import SettingsAboutTab from "./settings/SettingsAboutTab";
import SettingsAdvancedTab from "./settings/SettingsAdvancedTab";
import SettingsProfileTab from "./settings/SettingsProfileTab";
import SettingsThemeTab from "./settings/SettingsThemeTab";
import SettingsVoiceTab from "./settings/SettingsVoiceTab";

const tabs: SettingsTab[] = [
	{
		name: "profile",
		text: "Profile",
		auth: true,
		children: [{ name: "my-account", text: "My Account", auth: true, icon: <IconMingcuteUser3Fill />, component: SettingsProfileTab }],
	},
	{
		name: "app-settings",
		text: "App Settings",
		children: [
			{ name: "theme", text: "Theme", icon: <IconMingcuteColorPickerFill />, component: SettingsThemeTab },
			{ name: "notification", text: "Notification", icon: <IconMingcuteNotificationFill /> },
			{ name: "voice", text: "Audio & Video", icon: <IconMingcuteSpeakerFill />, component: SettingsVoiceTab },
			{ name: "advanced", text: "Advanced", icon: <IconMingcuteServerFill />, component: SettingsAdvancedTab },
		],
	},
	{
		name: "miscellaneous",
		text: "Miscellaneous",
		children: [{ name: "about", text: "About", icon: <IconMingcuteBook2Fill />, component: SettingsAboutTab }],
	},
];

const defaultTabIndex = 0;

function useFlatTabs() {
	const client = useClient();

	return tabs.filter((x) => x.children && (client?.gateway.status === "authenticated" || !x?.auth)).flatMap((x) => x.children);
}

export default function SettingsModal() {
	const { settings: modal, updateModals } = useModals();
	// const posthog = usePostHog();

	const flatTabs = useFlatTabs();
	const [currentTab, setCurrentTab] = useState(() => flatTabs[defaultTabIndex]?.text ?? "");

	const settings = useSettings();
	const currentSettings = useRef({ ...settingsStore.getState() });
	const [_settingsValid, setSettingsValid] = useState(false);
	// const [modifiedSettings, setModifiedSettings] = useState<DeepPartial<AppSettings> | undefined>(undefined);

	useEffect(() => {
		if (modal.isOpen) {
			// setModifiedSettings({ ...settings });
			setCurrentTab(flatTabs[defaultTabIndex]?.text ?? "");
			setSettingsValid(true);
			// currentSettings.current = { ...settingsStore.getState() };
			// posthog.capture("settings_modal_opened");
		} else {
			onSave();
			// posthog.capture("settings_modal_closed");
		}
	}, [modal.isOpen]);

	useEffect(() => {
		onSave();
		currentSettings.current = { ...settingsStore.getState() };
	}, [currentTab]);

	async function onSave() {
		// TODO: THIS IS NOT CORRECTLY CHECKING
		// if (modifiedSettings && modifiedSettings !== settings) {
		// await settings.setSettings(modifiedSettings);
		await settings.saveSettings();
		// }
	}

	function onTabChanged(index: number) {
		setCurrentTab(flatTabs[index]?.text ?? "");
	}

	function onSettingsChanged(value: DeepPartial<AppSettings>) {
		settings.setSettings(value);
	}

	return (
		<div className="h-full w-full p-10">
			<DialogPanel
				transition
				className="relative h-full transform rounded-xl border-2 border-primary-800 bg-surface transition-[opacity_transform] duration-200 data-closed:scale-90"
			>
				<TabGroup className="flex h-full w-full" vertical defaultIndex={defaultTabIndex} onChange={onTabChanged}>
					<div className="h-full rounded-l-xl bg-surface-alt/50">
						<TabList className="flex h-full w-48 select-none flex-col py-2">
							<DialogTitle className="mx-5 my-3 flex items-center justify-start gap-x-1.5">
								<div className="font-medium text-2xl text-text">Settings</div>
							</DialogTitle>
							<SettingsTabs />
						</TabList>
					</div>
					{<SettingsPanels currentTab={currentTab} onChange={onSettingsChanged} onSave={onSave} />}
				</TabGroup>
				<ModalCloseButton
					onClick={() => {
						updateModals({ settings: { isOpen: false } });
					}}
				/>
			</DialogPanel>
		</div>
	);
}

function SettingsTabs() {
	const client = useClient();

	return (
		<div className="flex h-full w-full flex-col gap-y-1 overflow-y-auto">
			{tabs.map(
				(tab, i) =>
					(client?.gateway.status === "authenticated" || !tab.auth) && (
						<Fragment key={tab.name}>
							<div className={clsx("mb-1 w-full px-2.5 text-left text-text/50 text-xs uppercase", i === 0 ? "mt-2" : "mt-4")}>{tab.text}</div>
							{tab.children?.map((child) => (
								<div className="w-full px-2" key={child.name}>
									<Tab as={Fragment}>
										{({ selected }) => (
											<button
												type="button"
												className={clsx(
													"flex w-full cursor-pointer items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-base text-text outline-hidden",
													selected ? "bg-white/20 text-text/100" : "text-text/70 hover:bg-white/10 hover:text-text/100",
												)}
											>
												{child.icon}
												<span>{child.text}</span>
											</button>
										)}
									</Tab>
								</div>
							))}
						</Fragment>
					),
			)}
		</div>
	);
}

const TabComponent = memo(
	(props: {
		component: (props: SettingsTabProps) => React.JSX.Element | undefined;
		onChange: (value: DeepPartial<AppSettings>) => void;
		onSave: () => Promise<void>;
	}) => {
		if (!props.component) return;
		return <props.component onChange={props.onChange} onSave={props.onSave} />;
	},
);

function SettingsPanels(props: { currentTab: string; onChange: (value: DeepPartial<AppSettings>) => void; onSave: () => Promise<void> }) {
	const flatTabs = useFlatTabs();

	return (
		<TabPanels className="flex w-full flex-col">
			<div className="mt-5 mb-5 ml-5 shrink-0 text-text text-xl select-none">{props.currentTab}</div>
			{flatTabs.map((tab) => (
				<TabPanel key={tab?.name} className="scroll-alternative h-full overflow-x-visible overflow-y-scroll pr-3">
					<div className="ml-5">
						{tab?.component ? (
							<TabComponent onChange={props.onChange} onSave={props.onSave} component={tab.component} />
						) : (
							<span className="text-base text-text/50 italic">{tab?.name} (Soon...)</span>
						)}
					</div>
				</TabPanel>
			))}
		</TabPanels>
	);
}
