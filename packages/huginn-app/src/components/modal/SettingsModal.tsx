import type { DeepPartial, SettingsTab, SettingsTabProps } from "@/types.ts";
import ModalCloseButton from "@components/button/ModalCloseButton.tsx";
import BaseModal from "@components/modal/BaseModal.tsx";
import SettingsAboutTab from "@components/modal/settings/SettingsAboutTab.tsx";
import SettingsAdvancedTab from "@components/modal/settings/SettingsAdvancedTab.tsx";
import SettingsProfileTab from "@components/modal/settings/SettingsProfileTab.tsx";
import SettingsThemeTab from "@components/modal/settings/SettingsThemeTab.tsx";
import { useClient } from "@contexts/apiContext.tsx";
import { useModals, useModalsDispatch } from "@contexts/modalContext.tsx";
import { type SettingsContextType, useSettings, useSettingsDispatcher } from "@contexts/settingsContext.tsx";
import { DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { clsx } from "@nick/clsx";
import { usePostHog } from "posthog-js/react";
import type React from "react";
import { Fragment, memo, useEffect, useRef, useState } from "react";

const tabs: SettingsTab[] = [
	{
		name: "profile",
		text: "Profile",
		auth: true,
		children: [{ name: "my-account", text: "My Account", auth: true, icon: <IconMdiAccount />, component: SettingsProfileTab }],
	},
	{
		name: "app-settings",
		text: "App Settings",
		children: [
			{ name: "theme", text: "Theme", icon: <IconMdiTheme />, component: SettingsThemeTab },
			{ name: "notification", text: "Notification", icon: <IconMdiNotifications /> },
			{ name: "audio", text: "Audio", icon: <IconMdiSpeakerphone /> },
			{ name: "advanced", text: "Advanced", icon: <IconMdiServer />, component: SettingsAdvancedTab },
		],
	},
	{
		name: "miscellaneous",
		text: "Miscellaneous",
		children: [{ name: "about", text: "About", icon: <IconMdiAbout />, component: SettingsAboutTab }],
	},
];

const defaultTabIndex = 0;

function useFlatTabs() {
	const client = useClient();

	return tabs.filter((x) => x.children && (client.isLoggedIn || !x?.auth)).flatMap((x) => x.children);
}

export default function SettingsModal() {
	const { settings: modal } = useModals();
	const posthog = usePostHog();

	const dispatch = useModalsDispatch();

	const flatTabs = useFlatTabs();
	const [currentTab, setCurrentTab] = useState(() => flatTabs[defaultTabIndex]?.text ?? "");

	const settings = useSettings();
	const [settingsValid, setSettingsValid] = useState(false);
	const modifiedSettings = useRef<DeepPartial<SettingsContextType>>();
	const settingsDispatch = useSettingsDispatcher();

	useEffect(() => {
		if (modal.isOpen) {
			modifiedSettings.current = { ...settings };
			setCurrentTab(flatTabs[defaultTabIndex]?.text ?? "");
			setSettingsValid(true);
			posthog.capture("settings_modal_opened");
		} else {
			if (
				(modifiedSettings.current?.serverAddress && settings.serverAddress !== modifiedSettings.current.serverAddress) ||
				(modifiedSettings.current?.cdnAddress && settings.cdnAddress !== modifiedSettings.current.cdnAddress)
			) {
				dispatch({
					info: {
						isOpen: true,
						status: "default",
						text: "Server or CDN address changed. The app should be restarted!",
						title: "Hang on!",
						action: {
							confirm: {
								text: "Restart",
								callback: async () => {
									await onSave();
									dispatch({ info: { isOpen: false } });
									location.reload();
								},
							},
							cancel: {
								text: "Revert",
								callback: () => {
									modifiedSettings.current = { ...settings };
									dispatch({ info: { isOpen: false } });
								},
							},
						},
						closable: false,
					},
				});
			} else {
				onSave();
			}

			posthog.capture("settings_modal_closed");
		}
	}, [modal.isOpen]);

	async function onSave() {
		if (modifiedSettings.current && modifiedSettings.current !== settings) {
			await settingsDispatch(modifiedSettings.current);
		}
	}

	function onTabChanged(index: number) {
		setCurrentTab(flatTabs[index]?.text ?? "");
	}

	function onSettingsChanged(value: DeepPartial<SettingsContextType>) {
		modifiedSettings.current = { ...modifiedSettings.current, ...value };
	}

	return (
		<BaseModal
			modal={modal}
			onClose={() => {
				dispatch({ settings: { isOpen: false } });
			}}
		>
			<DialogPanel className="flex h-[30rem] w-full max-w-3xl transform rounded-xl border-2 border-primary/50 bg-background transition-[opacity_transform] data-[closed]:scale-95">
				<TabGroup className="flex w-full" vertical defaultIndex={defaultTabIndex} onChange={onTabChanged}>
					<div className="h-full rounded-l-xl bg-secondary/50">
						<TabList className="flex h-full w-48 select-none flex-col py-2">
							<DialogTitle className="mx-5 my-3 flex items-center justify-start gap-x-1.5">
								<div className="font-medium text-2xl text-text">Settings</div>
							</DialogTitle>
							<SettingsTabs />
						</TabList>
					</div>
					{settingsValid && modifiedSettings.current && (
						<SettingsPanels currentTab={currentTab} settings={modifiedSettings.current} onChange={onSettingsChanged} onSave={onSave} />
					)}
				</TabGroup>
				<ModalCloseButton
					onClick={() => {
						dispatch({ settings: { isOpen: false } });
					}}
				/>
			</DialogPanel>
		</BaseModal>
	);
}

function SettingsTabs() {
	const client = useClient();

	return (
		<div className="flex h-full w-full flex-col gap-y-1 overflow-y-auto">
			{tabs.map(
				(tab, i) =>
					(client.isLoggedIn || !tab.auth) && (
						<Fragment key={tab.name}>
							<div className={clsx("mb-1 w-full px-2.5 text-left text-text/50 text-xs uppercase", i === 0 ? "mt-2" : "mt-4")}>{tab.text}</div>
							{tab.children?.map((child) => (
								<div className="w-full px-2" key={child.name}>
									<Tab as={Fragment}>
										{({ selected }) => (
											<button
												type="button"
												className={clsx(
													"flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-base text-text outline-none",
													selected ? "bg-white/20 text-opacity-100" : "text-opacity-70 hover:bg-white/10 hover:text-opacity-100",
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
		component: (props: SettingsTabProps) => React.JSX.Element;
		onChange: (value: DeepPartial<SettingsContextType>) => void;
		onSave: () => Promise<void>;
		settings: DeepPartial<SettingsContextType>;
	}) => {
		const Component = props.component;

		if (!Component) return;
		return <Component settings={props.settings} onChange={props.onChange} onSave={props.onSave} />;
	},
);

function SettingsPanels(props: {
	settings: DeepPartial<SettingsContextType>;
	currentTab: string;
	onChange: (value: DeepPartial<SettingsContextType>) => void;
	onSave: () => Promise<void>;
}) {
	const flatTabs = useFlatTabs();

	return (
		<TabPanels className="flex w-full flex-col p-5 pr-0">
			<div className="text-text mb-5 shrink-0 text-xl">{props.currentTab}</div>
			{flatTabs.map((tab) => (
				<TabPanel key={tab?.name} className="scroll-alternative h-full overflow-y-scroll pr-3">
					{tab?.component ? (
						<TabComponent onChange={props.onChange} onSave={props.onSave} settings={props.settings} component={tab.component} />
					) : (
						<span className="text-text/50 text-base italic">{tab?.name} (Soon...)</span>
					)}
				</TabPanel>
			))}
		</TabPanels>
	);
}
