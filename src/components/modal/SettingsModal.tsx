import {
   Dialog,
   DialogPanel,
   DialogTitle,
   Tab,
   TabGroup,
   TabList,
   TabPanel,
   TabPanels,
   Transition,
   TransitionChild,
} from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useModals, useModalsDispatch } from "../../contexts/modalContext";
import { SettingsContextType, useSettings, useSettingsDispatcher } from "../../contexts/settingsContext";
import ModalCloseButton from "../button/ModalCloseButton";
import ModalBackground from "./ModalBackground";
import SettingsAboutTab from "./settings/SettingsAboutTab";
import SettingsAdvancedTab from "./settings/SettingsAdvancedTab";
import SettingsThemeTab from "./settings/SettingsThemeTab";
import { DeepPartial, SettingsTab } from "../../types";

const tabs: SettingsTab[] = [
   { name: "general", text: "General", children: [{ name: "audio", text: "Audio", icon: <IconMdiSpeakerphone /> }] },
   {
      name: "app-settings",
      text: "App Settings",
      children: [
         { name: "theme", text: "Theme", icon: <IconMdiTheme />, component: SettingsThemeTab },
         { name: "notification", text: "Notification", icon: <IconMdiNotifications /> },
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
   return tabs.filter((x) => x.children).flatMap((x) => x.children!);
}

export default function SettingsModal() {
   const { settings: modal } = useModals();
   const dispatch = useModalsDispatch();

   const flatTabs = useFlatTabs();
   const [currentTab, setCurrentTab] = useState(() => flatTabs[defaultTabIndex].text);

   const settings = useSettings();
   const modifiedSettings = useRef<DeepPartial<SettingsContextType>>({});
   const settingsDispatch = useSettingsDispatcher();

   useEffect(() => {
      if (!window.__TAURI__) return;

      if (modal.isOpen) {
         modifiedSettings.current = { ...settings };
      } else {
         settingsDispatch(modifiedSettings.current);
      }
   }, [modal.isOpen]);

   function onTabChanged(index: number) {
      setCurrentTab(flatTabs[index].text);
   }

   function onSettingsChanged(value: DeepPartial<SettingsContextType>) {
      modifiedSettings.current = { ...modifiedSettings.current, ...value };
   }

   return (
      <Transition show={modal.isOpen}>
         <Dialog as="div" className="relative z-10" onClose={() => dispatch({ settings: { isOpen: false } })}>
            <ModalBackground />
            <div className="fixed inset-0 top-6">
               <div className="flex h-full items-center justify-center">
                  <TransitionChild
                     enter="duration-150 ease-out"
                     enterFrom="opacity-0 scale-95"
                     enterTo="opacity-100 scale-100"
                     leave="duration-150 ease-in"
                     leaveFrom="opacity-100 scale-100"
                     leaveTo="opacity-0 scale-95"
                  >
                     <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-lg border-2 border-primary/50 bg-background transition-[opacity_transform]">
                        <TabGroup className="flex" vertical defaultIndex={defaultTabIndex} onChange={onTabChanged}>
                           <div className="bg-secondary/50">
                              <TabList className="flex w-48 flex-shrink-0 select-none flex-col items-start py-2">
                                 <DialogTitle className="mx-5 mb-3 mt-3 flex items-center justify-start gap-x-1.5">
                                    <div className="text-2xl font-medium text-text">Settings</div>
                                 </DialogTitle>
                                 <SettingsTabs />
                              </TabList>
                           </div>
                           <SettingsPanels currentTab={currentTab} settings={modifiedSettings.current} onChange={onSettingsChanged} />
                        </TabGroup>
                        <ModalCloseButton onClick={() => dispatch({ settings: { isOpen: false } })} />
                     </DialogPanel>
                  </TransitionChild>
               </div>
            </div>
         </Dialog>
      </Transition>
   );
}

function SettingsTabs() {
   return (
      <div className="flex w-full flex-col items-center justify-center gap-y-1">
         {tabs.map((tab, i) => (
            <Fragment key={tab.name}>
               <div className={`mb-1 w-full px-2.5 text-left text-xs uppercase text-text/50 ${i === 0 ? "mt-2" : "mt-4"}`}>
                  {tab.text}
               </div>
               {tab.children?.map((child) => (
                  <div className="w-full px-2" key={child.name}>
                     <Tab as={Fragment}>
                        {({ selected }) => (
                           <button
                              className={`flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-base text-text outline-none ${
                                 selected ? "bg-white/20 text-opacity-100" : "text-opacity-70 hover:bg-white/10 hover:text-opacity-100"
                              }`}
                           >
                              {child.icon}
                              <span>{child.text}</span>
                           </button>
                        )}
                     </Tab>
                  </div>
               ))}
            </Fragment>
         ))}
      </div>
   );
}

function SettingsPanels(props: {
   settings: DeepPartial<SettingsContextType>;
   currentTab: string;
   onChange: (value: DeepPartial<SettingsContextType>) => void;
}) {
   const flatTabs = useFlatTabs();

   return (
      <TabPanels className="flex w-full flex-col p-5">
         <div className="mb-5 shrink-0 text-xl text-text">{props.currentTab}</div>
         {flatTabs.map((tab) => (
            <TabPanel key={tab.name} className="h-full">
               {tab.component ? (
                  () => {
                     const Component = tab.component!;
                     return <Component settings={props.settings} onChange={props.onChange}></Component>;
                  }
               ) : (
                  <span className="text-base italic text-text/50">{tab.name} (Soon...)</span>
               )}
               {/* <component :is="{ ...tab.component }" v-else v-model="settings" /> */}
            </TabPanel>
         ))}
      </TabPanels>
   );
}
