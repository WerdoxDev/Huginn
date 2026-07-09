import { Tabs } from "@base-ui/react";
import clsx from "clsx";
import { createContext, type ReactNode, useContext } from "react";

const TabContext = createContext<string | undefined>("");
const TabPanelContext = createContext<string | undefined>("");

export default function HuginnTab(props: {
   children?: ReactNode;
   onChange?: (value: string) => void;
   defaultTab?: string;
   className?: string;
   style?: React.CSSProperties;
   value?: string;
}) {
   return (
      <Tabs.Root onValueChange={props.onChange} value={props.value} className={props.className} defaultValue={props.defaultTab} style={props.style}>
         {props.children}
      </Tabs.Root>
   );
}

function TabList(props: { className?: string; children?: ReactNode; tabClassName?: string }) {
   return (
      <TabContext.Provider value={props.tabClassName}>
         <Tabs.List className={clsx(props.className, "bg-surface-alt text-text flex items-center justify-center gap-x-1 rounded-lg p-1")}>
            {props.children}
         </Tabs.List>
      </TabContext.Provider>
   );
}

function Tab(props: { className?: string; children?: ReactNode; value: string }) {
   const tabClassName = useContext(TabContext);

   return (
      <Tabs.Tab
         value={props.value}
         className={clsx(
            tabClassName,
            props.className,
            "hover:bg-primary-900/20 data-active:bg-primary-900 flex cursor-pointer items-center justify-center gap-x-2 rounded-md text-white/70 data-active:text-white data-active:transition-colors data-active:duration-300",
         )}
      >
         {props.children}
      </Tabs.Tab>
   );
}

function TabPanels(props: { className?: string; children?: ReactNode; panelClassName?: string; style?: React.CSSProperties }) {
   return (
      <TabPanelContext.Provider value={props.panelClassName}>
         <div className={clsx(props.className)} style={props.style}>
            {props.children}
         </div>
      </TabPanelContext.Provider>
   );
}

function TabPanel(props: { className?: string; children?: ReactNode; value: string; style?: React.CSSProperties }) {
   const panelClassName = useContext(TabPanelContext);
   return (
      <Tabs.Panel className={clsx(panelClassName, props.className)} value={props.value} style={props.style}>
         {props.children}
      </Tabs.Panel>
   );
}

HuginnTab.TabList = TabList;
HuginnTab.Tab = Tab;
HuginnTab.TabPanels = TabPanels;
HuginnTab.TabPanel = TabPanel;
