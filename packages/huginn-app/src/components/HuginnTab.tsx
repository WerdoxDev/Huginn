import { Tab as HTab, TabList as HTabList, TabPanel as HTabPanel, TabPanels as HTabPanels, TabGroup } from "@headlessui/react";
import clsx from "clsx";
import { createContext, type ReactNode, useContext } from "react";

const TabContext = createContext<string | undefined>("");
const TabPanelContext = createContext<string | undefined>("");

export default function HuginnTab(props: { children?: ReactNode; onChange?: (index: number) => void; selectedIndex?: number; className?: string }) {
   return (
      <TabGroup onChange={props.onChange} className={props.className} selectedIndex={props.selectedIndex}>
         {props.children}
      </TabGroup>
   );
}

function TabList(props: { className?: string; children?: ReactNode; tabClassName?: string }) {
   return (
      <TabContext.Provider value={props.tabClassName}>
         <HTabList className={clsx(props.className, "bg-surface-alt text-text flex items-center justify-center gap-x-1 rounded-lg p-1")}>
            {props.children}
         </HTabList>
      </TabContext.Provider>
   );
}

function Tab(props: { className?: string; children?: ReactNode }) {
   const tabClassName = useContext(TabContext);

   return (
      <HTab
         className={clsx(
            tabClassName,
            props.className,
            "hover:bg-primary-900/20 data-selected:bg-primary-900 flex cursor-pointer items-center justify-center gap-x-2 rounded-md text-white/70 data-selected:text-white data-selected:transition-colors data-selected:duration-300",
         )}
      >
         {props.children}
      </HTab>
   );
}

function TabPanels(props: { className?: string; children?: ReactNode; panelClassName?: string }) {
   return (
      <TabPanelContext.Provider value={props.panelClassName}>
         <HTabPanels className={clsx(props.className)}>{props.children}</HTabPanels>
      </TabPanelContext.Provider>
   );
}

function TabPanel(props: { className?: string; children?: ReactNode }) {
   const panelClassName = useContext(TabPanelContext);
   return <HTabPanel className={clsx(panelClassName, props.className)}>{props.children}</HTabPanel>;
}

HuginnTab.TabList = TabList;
HuginnTab.Tab = Tab;
HuginnTab.TabPanels = TabPanels;
HuginnTab.TabPanel = TabPanel;
