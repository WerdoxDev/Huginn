import { DeepPartial, SettingsTab } from "@/types";
import ModalCloseButton from "@components/button/ModalCloseButton";
import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { SettingsContextType, useSettings, useSettingsDispatcher } from "@contexts/settingsContext";
import {
   Dialog,
   DialogBackdrop,
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
import ModalBackground from "./ModalBackground";
import SettingsAboutTab from "./settings/SettingsAboutTab";
import SettingsAdvancedTab from "./settings/SettingsAdvancedTab";
import SettingsThemeTab from "./settings/SettingsThemeTab";
import SettingsProfileTab from "./settings/SettingsProfileTab";

const tabs: SettingsTab[] = [
   {
      name: "profile",
      text: "Profile",
      children: [{ name: "my-account", text: "My Account", icon: <IconMdiAccount />, component: SettingsProfileTab }],
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
   return tabs.filter(x => x.children).flatMap(x => x.children);
}

export default function SettingsModal() {
   const { settings: modal } = useModals();
   const dispatch = useModalsDispatch();

   const flatTabs = useFlatTabs();
   const [currentTab, setCurrentTab] = useState(() => flatTabs[defaultTabIndex]?.text ?? "");

   const settings = useSettings();
   const modifiedSettings = useRef<DeepPartial<SettingsContextType>>({});
   const settingsDispatch = useSettingsDispatcher();

   useEffect(() => {
      if (!window.__TAURI__) return;

      if (modal.isOpen) {
         modifiedSettings.current = { ...settings };
      } else {
         if (modifiedSettings.current.serverAddress && settings.serverAddress !== modifiedSettings.current.serverAddress) {
            dispatch({
               info: {
                  isOpen: true,
                  status: "default",
                  text: "Server ip changed. The app should be restarted!",
                  title: "Hang on!",
                  action: {
                     confirm: {
                        text: "Restart",
                        callback: () => {
                           settingsDispatch(modifiedSettings.current);
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
            settingsDispatch(modifiedSettings.current);
         }
      }
   }, [modal.isOpen]);

   function onTabChanged(index: number) {
      setCurrentTab(flatTabs[index]?.text ?? "");
   }

   function onSettingsChanged(value: DeepPartial<SettingsContextType>) {
      modifiedSettings.current = { ...modifiedSettings.current, ...value };
   }

   return (
      <Dialog
         open={modal.isOpen}
         className="relative z-10 transition data-[closed]:opacity-0"
         transition
         onClose={() => {
            dispatch({ settings: { isOpen: false } });
         }}
      >
         <ModalBackground />
         <div className="fixed inset-0 top-6">
            <div className="flex h-full items-center justify-center">
               <TransitionChild>
                  <DialogPanel className="border-primary/50 bg-background flex h-[30rem] w-full max-w-3xl transform rounded-xl border-2 transition-[opacity_transform] data-[closed]:scale-95">
                     <TabGroup className="flex w-full" vertical defaultIndex={defaultTabIndex} onChange={onTabChanged}>
                        <div className="bg-secondary/50 h-full rounded-l-xl">
                           <TabList className="flex h-full w-48 select-none flex-col py-2">
                              <DialogTitle className="mx-5 my-3 flex items-center justify-start gap-x-1.5">
                                 <div className="text-text text-2xl font-medium">Settings</div>
                              </DialogTitle>
                              <SettingsTabs />
                           </TabList>
                        </div>
                        <SettingsPanels currentTab={currentTab} settings={modifiedSettings.current} onChange={onSettingsChanged} />
                     </TabGroup>
                     <ModalCloseButton
                        onClick={() => {
                           dispatch({ settings: { isOpen: false } });
                        }}
                     />
                  </DialogPanel>
               </TransitionChild>
            </div>
         </div>
      </Dialog>
   );
}

function SettingsTabs() {
   return (
      <div className="flex h-full w-full flex-col gap-y-1 overflow-y-auto">
         {tabs.map((tab, i) => (
            <Fragment key={tab.name}>
               <div className={`text-text/50 mb-1 w-full px-2.5 text-left text-xs uppercase ${i === 0 ? "mt-2" : "mt-4"}`}>
                  {tab.text}
               </div>
               {tab.children?.map(child => (
                  <div className="w-full px-2" key={child.name}>
                     <Tab as={Fragment}>
                        {({ selected }) => (
                           <button
                              className={`text-text flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-base outline-none ${
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

   function TabComponent(props: {
      tab: SettingsTab;
      onChange: (value: DeepPartial<SettingsContextType>) => void;
      settings: DeepPartial<SettingsContextType>;
   }) {
      const Component = props.tab.component;

      if (!Component) return;
      return <Component settings={props.settings} onChange={props.onChange}></Component>;
   }

   return (
      <TabPanels className="flex w-full flex-col p-5 pr-0">
         <div className="text-text mb-5 shrink-0 text-xl">{props.currentTab}</div>
         {flatTabs.map(tab => (
            <TabPanel key={tab?.name} className="scroll-alternative h-full overflow-y-scroll pr-3">
               {tab?.component ? (
                  <TabComponent onChange={props.onChange} settings={props.settings} tab={tab} />
               ) : (
                  <span className="text-text/50 text-base italic">{tab?.name} (Soon...)</span>
               )}
            </TabPanel>
         ))}
      </TabPanels>
   );
}
