import type { DeepPartial } from "@huginn/shared";

import { Dialog } from "@base-ui/react";
import ModalCloseButton from "@components/button/ModalCloseButton";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@components/Tab";
import { DialogTitle, Transition } from "@headlessui/react";
import { useIsMobile } from "@hooks/useIsMobile";
import { useThrottler } from "@hooks/useThrottler";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import clsx from "clsx";
// import { usePostHog } from "posthog-js/react";
import { Fragment, memo, useEffect, useMemo, useState } from "react";

import type { AppSettings, SettingsTab, SettingsTabProps } from "@/types";

import HuginnDialogPanel from "./HuginnDialogPanel";
import SettingsAboutTab from "./settings/SettingsAboutTab";
import SettingsAdvancedTab from "./settings/SettingsAdvancedTab";
import SettingsCustomTab from "./settings/SettingsCustomTab";
import SettingsProfileTab from "./settings/SettingsProfileTab";
import SettingsSubmissionTab from "./settings/SettingsSubmissionTab";
import SettingsThemeTab from "./settings/SettingsThemeTab";
import SettingsVoiceTab from "./settings/SettingsVoiceTab";

const tabs: SettingsTab[] = [
   {
      name: "profile",
      text: "Profile",
      auth: true,
      children: [
         {
            name: "my-profile",
            text: "My Profile",
            auth: true,
            icon: <IconMingcuteUser3Fill />,
            component: SettingsProfileTab,
         },
      ],
   },
   {
      name: "app-settings",
      text: "App Settings",
      children: [
         {
            name: "theme",
            text: "Theme",
            icon: <IconMingcuteColorPickerFill />,
            component: SettingsThemeTab,
         },
         { name: "notification", text: "Notification", icon: <IconMingcuteNotificationFill /> },
         {
            name: "voice",
            text: "Audio & Video",
            icon: <IconMingcuteSpeakerFill />,
            component: SettingsVoiceTab,
         },
         // { name: "keybind", text: "Keybinds", icon: <IconMingcuteHotkeyFill />, component: SettingsKeybindsTab },
         {
            name: "advanced",
            text: "Advanced",
            icon: <IconMingcuteServerFill />,
            component: SettingsAdvancedTab,
         },
      ],
   },
   {
      name: "activity",
      text: "Activity",
      auth: true,
      children: [
         {
            name: "registered-apps",
            text: "Registered Apps",
            icon: <IconMingcuteEmptyBoxFill />,
            component: SettingsCustomTab,
         },
         {
            name: "contributions",
            text: "Contributions",
            icon: <IconMingcuteChecksFill />,
            component: SettingsSubmissionTab,
         },
      ],
   },
   {
      name: "miscellaneous",
      text: "Miscellaneous",
      children: [
         {
            name: "about",
            text: "About",
            icon: <IconMingcuteBook2Fill />,
            component: SettingsAboutTab,
         },
      ],
   },
];

function useFlatTabs() {
   const client = useClient();

   return tabs.filter((x) => x.children && (client?.gateway.status === "authenticated" || !x?.auth)).flatMap((x) => x.children);
}

export default function SettingsModal() {
   const { settings: modal, updateModals } = useModals();
   const flatTabs = useFlatTabs();
   const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
   const [displayIndex, setDisplayIndex] = useState<number | null>(0);
   const currentTabText = useMemo(
      () => (displayIndex !== null ? flatTabs[displayIndex] : selectedIndex !== null ? flatTabs[selectedIndex] : null)?.text ?? "",
      [selectedIndex],
   );
   const [showContent, setShowContent] = useState(false);
   const isMobile = useIsMobile();

   const settings = useStorage("settings");
   const { setValue: setStorageValue, setCachedValue } = useStorageStore();
   const [_settingsValid, setSettingsValid] = useState(false);

   useEffect(() => {
      if (modal.isOpen) {
         setSettingsValid(true);
         if (!isMobile) setShowContent(true);
         if (isMobile) setSelectedIndex(null);
      }
   }, [modal.isOpen]);

   function onTabChanged(index: number | null) {
      setSelectedIndex(index);
      setDisplayIndex(null);
      setShowContent(true);
   }

   const { throttledFunction } = useThrottler(async (value: Partial<AppSettings>) => {
      await setStorageValue("settings", { ...settings, ...value });
   }, 1000);

   function handleSettingsChanged(value: Partial<AppSettings>) {
      setCachedValue("settings", { ...settings, ...value });
      throttledFunction(value);
   }

   function handleBackClick() {
      setShowContent(false);
      setDisplayIndex(selectedIndex);
      setSelectedIndex(null);
   }

   function handleAfterLeave() {
      setDisplayIndex(null);
   }

   return (
      // <div className="flex h-full w-full items-center justify-center pt-20 lg:px-10 lg:pt-0">
      <HuginnDialogPanel className="h-full w-full max-w-6xl lg:mx-10">
         <TabGroup
            className="flex h-full w-full"
            selectedIndex={selectedIndex}
            displayIndex={displayIndex !== null ? displayIndex : undefined}
            onChange={onTabChanged}
         >
            {/* Mobile: Show tabs or content based on state */}
            <div className={clsx("bg-surface-alt h-full rounded-l-xl lg:block", "block w-full rounded-r-xl lg:w-auto lg:rounded-r-none")}>
               <TabList className="flex h-full flex-col select-none">
                  <Dialog.Title className="text-text p-5 text-2xl font-bold">Settings</Dialog.Title>
                  <SettingsTabs />
               </TabList>
            </div>

            {/* Mobile: Content with back button */}
            <Transition show={showContent} afterLeave={handleAfterLeave}>
               <div
                  className={clsx(
                     "bg-surface absolute inset-0 flex w-full flex-col transition-[transform_opacity] duration-300 data-closed:translate-x-1/2 data-closed:opacity-0 lg:relative lg:flex lg:data-closed:translate-none lg:data-closed:opacity-100",
                  )}
               >
                  {/* Back button - only visible on mobile when content is shown */}
                  <div className="bg-surface-alt flex items-center gap-x-2 border-b border-white/10 px-3 py-4 lg:hidden">
                     <button onClick={handleBackClick} className="active:bg-surface flex items-center gap-x-2 rounded-md p-1 text-white">
                        <IconMingcuteLeftFill className="size-5" />
                        <span>Back</span>
                     </button>
                  </div>

                  <SettingsPanels currentTabText={currentTabText} onChange={handleSettingsChanged} />
               </div>
            </Transition>
         </TabGroup>

         <ModalCloseButton
            onClick={() => {
               updateModals({ settings: { isOpen: false } });
            }}
         />
      </HuginnDialogPanel>
      // </div>
   );
}

function SettingsTabs() {
   const client = useClient();

   return (
      <div className="scroll-surface scroll-thin flex h-full w-full flex-col overflow-y-scroll pb-2 lg:w-52">
         {tabs
            .filter((x) => client?.gateway.status === "authenticated" || !x.auth)
            .map((tab, i) => (
               <Fragment key={tab.name}>
                  {i !== 0 && <div className="bg-surface my-3 mr-0.5 ml-3 hidden h-px shrink-0 lg:my-2 lg:block" />}
                  <div className={clsx("pr-2 pb-2 pl-4 text-left text-sm text-white/50 lg:pb-1", i === 0 ? "pt-0" : "pt-4 lg:pt-1.5")}>
                     {tab.text}
                  </div>
                  <div className="bg-surface ml-2.5 flex flex-col gap-y-1 rounded-lg p-2.5 lg:bg-transparent lg:p-0">
                     {tab.children?.map((child) => (
                        <div className="w-full" key={child.name}>
                           <Tab>
                              {({ selected }) => (
                                 <button
                                    type="button"
                                    className={clsx(
                                       "text-text flex w-full cursor-pointer items-center gap-x-2 rounded-md px-2 py-2 text-left text-base whitespace-nowrap outline-hidden active:bg-white/10 active:text-white lg:active:bg-white/3",
                                       selected
                                          ? "bg-white/10 text-white transition-colors duration-300"
                                          : "text-white/70 hover:bg-white/3 hover:text-white",
                                    )}
                                 >
                                    <div className="shrink-0">{child.icon}</div>
                                    <span>{child.text}</span>
                                    <IconMingcuteRightFill className="ml-auto lg:hidden" />
                                 </button>
                              )}
                           </Tab>
                        </div>
                     ))}
                  </div>
               </Fragment>
            ))}
      </div>
   );
}

const TabComponent = memo(
   (props: { component: (props: SettingsTabProps) => React.JSX.Element | undefined; onChange: (value: Partial<AppSettings>) => void }) => {
      if (!props.component) return;
      return <props.component onChange={props.onChange} />;
   },
);

function SettingsPanels(props: { currentTabText: string | null; onChange: (value: Partial<AppSettings>) => void }) {
   const flatTabs = useFlatTabs();

   return (
      props.currentTabText && (
         <TabPanels className="flex w-full flex-col overflow-hidden">
            <div className="text-text mt-3 ml-3 shrink-0 text-xl select-none lg:mt-5 lg:ml-5">{props.currentTabText}</div>
            {flatTabs.map((tab) => (
               <TabPanel
                  key={tab?.name}
                  className="scroll-surface-deep mt-3 h-full overflow-x-visible overflow-y-scroll pb-3 pl-3 lg:mt-5 lg:pr-1.5 lg:pb-5 lg:pl-5"
               >
                  {/* <div className="ml-5"> */}
                  {tab?.component ? (
                     <TabComponent onChange={props.onChange} component={tab.component} />
                  ) : (
                     <span className="text-text/50 text-base italic">{tab?.name} (Soon...)</span>
                  )}
                  {/* </div> */}
               </TabPanel>
            ))}
         </TabPanels>
      )
   );
}
