import ModalCloseButton from "@components/button/ModalCloseButton";
import { DialogTitle, Transition } from "@headlessui/react";
import type { DeepPartial } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import clsx from "clsx";
// import { usePostHog } from "posthog-js/react";
import { Fragment, memo, useEffect, useMemo, useState } from "react";
import type { AppSettings, SettingsTab, SettingsTabProps } from "@/types";
import SettingsAboutTab from "./settings/SettingsAboutTab";
import SettingsAdvancedTab from "./settings/SettingsAdvancedTab";
import SettingsProfileTab from "./settings/SettingsProfileTab";
import SettingsThemeTab from "./settings/SettingsThemeTab";
import SettingsVoiceTab from "./settings/SettingsVoiceTab";
import SettingsSubmissionTab from "./settings/SettingsSubmissionTab";
import SettingsCustomTab from "./settings/SettingsCustomTab";
import BaseDialogPanel from "./BaseDialogPanel";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@components/Tab";
import { useIsMobile } from "@hooks/useIsMobile";

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
         // { name: "keybind", text: "Keybinds", icon: <IconMingcuteHotkeyFill />, component: SettingsKeybindsTab },
         { name: "advanced", text: "Advanced", icon: <IconMingcuteServerFill />, component: SettingsAdvancedTab },
      ],
   },
   {
      name: "activity",
      text: "Activity",
      auth: true,
      children: [
         { name: "submissions", text: "Submission", icon: <IconMingcuteChecksFill />, component: SettingsSubmissionTab },
         { name: "custom", text: "Custom", icon: <IconMingcuteEmptyBoxFill />, component: SettingsCustomTab },
      ],
   },
   {
      name: "miscellaneous",
      text: "Miscellaneous",
      children: [{ name: "about", text: "About", icon: <IconMingcuteBook2Fill />, component: SettingsAboutTab }],
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
   const { setValue, updateSettings } = useStorageStore();
   const [_settingsValid, setSettingsValid] = useState(false);

   useEffect(() => {
      if (modal.isOpen) {
         setSettingsValid(true);
         if (!isMobile) setShowContent(true);
         if (isMobile) setSelectedIndex(null);
      } else {
         onSave();
      }
   }, [modal.isOpen]);

   useEffect(() => {
      console.log(isMobile, showContent, selectedIndex);
   }, [isMobile, showContent, selectedIndex]);

   useEffect(() => {
      onSave();
   }, [currentTabText]);

   async function onSave() {
      setValue("settings", settings);
   }

   function onTabChanged(index: number | null) {
      setSelectedIndex(index);
      setDisplayIndex(null);
      setShowContent(true);
   }

   function onSettingsChanged(value: DeepPartial<AppSettings>) {
      updateSettings(value);
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
      <div className="flex h-full w-full items-center justify-center pt-20 lg:px-10 lg:pt-0">
         <BaseDialogPanel className="h-full w-full max-w-6xl">
            <TabGroup
               className="flex h-full w-full"
               selectedIndex={selectedIndex}
               displayIndex={displayIndex !== null ? displayIndex : undefined}
               onChange={onTabChanged}
            >
               {/* Mobile: Show tabs or content based on state */}
               <div className={clsx("bg-surface-alt h-full rounded-l-xl lg:block", "block w-full rounded-r-xl lg:w-auto lg:rounded-r-none")}>
                  <TabList className="flex h-full flex-col pt-2 select-none">
                     <DialogTitle className="mx-5 my-3 flex items-center justify-start gap-x-1.5">
                        <div className="text-text text-2xl font-medium">Settings</div>
                     </DialogTitle>
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

                     <SettingsPanels currentTabText={currentTabText} onChange={onSettingsChanged} onSave={onSave} />
                  </div>
               </Transition>
            </TabGroup>

            <ModalCloseButton
               className="bg-surface! top-4 right-4"
               onClick={() => {
                  updateModals({ settings: { isOpen: false } });
               }}
            />
         </BaseDialogPanel>
      </div>
   );
}

function SettingsTabs() {
   const client = useClient();

   return (
      <div className="scroll-surface scroll-thin flex h-full w-full flex-col overflow-y-scroll pb-2 lg:w-52">
         {tabs.map(
            (tab, i) =>
               (client?.gateway.status === "authenticated" || !tab.auth) && (
                  <Fragment key={tab.name}>
                     {i !== 0 && <div className="bg-surface my-3 mr-0.5 ml-3 hidden h-px shrink-0 lg:my-2 lg:block" />}
                     <div className={clsx("mb-2 w-full px-4 text-left text-sm text-white/50 lg:mb-1", i === 0 ? "mt-2" : "mt-4 lg:mt-1.5")}>
                        {tab.text}
                     </div>
                     <div className="bg-surface ml-2.5 flex flex-col gap-y-1 rounded-lg p-2.5 lg:gap-y-0.5 lg:bg-transparent lg:p-0">
                        {tab.children?.map((child) => (
                           <div className="w-full" key={child.name}>
                              <Tab>
                                 {({ selected }) => (
                                    <button
                                       type="button"
                                       className={clsx(
                                          "text-text flex w-full cursor-pointer items-center gap-x-2 rounded-md px-2 py-2 text-left text-base whitespace-nowrap outline-hidden active:bg-white/10 active:text-white lg:py-1.5 lg:active:bg-white/3 lg:active:text-white",
                                          selected
                                             ? "bg-white/10 text-white transition-colors duration-300"
                                             : "text-white/80 hover:bg-white/3 hover:text-white lg:text-white/50",
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

function SettingsPanels(props: { currentTabText: string | null; onChange: (value: DeepPartial<AppSettings>) => void; onSave: () => Promise<void> }) {
   const flatTabs = useFlatTabs();

   return (
      props.currentTabText && (
         <TabPanels className="flex w-full flex-col overflow-hidden">
            <div className="text-text mt-5 mb-5 ml-5 shrink-0 text-xl select-none">{props.currentTabText}</div>
            {flatTabs.map((tab) => (
               <TabPanel key={tab?.name} className="scroll-surface-deep h-full overflow-x-visible overflow-y-scroll pr-3 pb-5">
                  <div className="ml-5">
                     {tab?.component ? (
                        <TabComponent onChange={props.onChange} onSave={props.onSave} component={tab.component} />
                     ) : (
                        <span className="text-text/50 text-base italic">{tab?.name} (Soon...)</span>
                     )}
                  </div>
               </TabPanel>
            ))}
         </TabPanels>
      )
   );
}
