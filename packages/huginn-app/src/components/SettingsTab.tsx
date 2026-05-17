import { createContext, useContext, useState, type ReactNode, useRef } from "react";

type TabContextValue = {
   selectedIndex: number | null;
   displayIndex?: number;
   onChange?: (index: number | null) => void;
};

const TabContext = createContext<TabContextValue | null>(null);
const PanelIndexContext = createContext<React.RefObject<number> | null>(null);
const TabIndexContext = createContext<React.RefObject<number> | null>(null);

function useTabContext() {
   const context = useContext(TabContext);
   if (!context) throw new Error("Tab components must be used within TabGroup");

   return context;
}

export default function SettingsTab(props: {
   children: ReactNode;
   selectedIndex: number | null;
   displayIndex?: number;
   onChange?: (index: number | null) => void;
   className?: string;
}) {
   return (
      <TabContext.Provider
         value={{
            onChange: props.onChange,
            selectedIndex: props.selectedIndex,
            displayIndex: props.displayIndex,
         }}
      >
         <div className={props.className}>{props.children}</div>
      </TabContext.Provider>
   );
}

function List(props: { children: ReactNode; className?: string }) {
   const tabIndexRef = useRef(0);

   return (
      <TabIndexContext.Provider value={tabIndexRef}>
         <div className={props.className}>{props.children}</div>
      </TabIndexContext.Provider>
   );
}

function Tab(props: { children: (props: { selected: boolean }) => ReactNode }) {
   const { selectedIndex, onChange } = useTabContext();

   const tabIndexRef = useContext(TabIndexContext);
   if (!tabIndexRef) throw new Error("Tab must be used within List");

   const [currentIndex] = useState(() => tabIndexRef.current++);
   const selected = selectedIndex === currentIndex;

   function handleClick() {
      onChange?.(currentIndex);
   }

   return (
      <>{props.children({ selected })}</> && (
         <div onClick={handleClick}>{typeof props.children === "function" ? props.children({ selected }) : props.children}</div>
      )
   );
}

function Panels(props: { children: ReactNode; className?: string }) {
   const panelIndexRef = useRef(0);

   return (
      <PanelIndexContext.Provider value={panelIndexRef}>
         <div className={props.className}>{props.children}</div>
      </PanelIndexContext.Provider>
   );
}

function Panel(props: { children: ReactNode; className?: string }) {
   const { selectedIndex, displayIndex } = useTabContext();

   const panelIndexRef = useContext(PanelIndexContext);
   if (!panelIndexRef) throw new Error("TabPanel must be used within Panels");

   const [currentIndex] = useState(() => panelIndexRef.current++);

   if ((selectedIndex === currentIndex && displayIndex === undefined) || displayIndex === currentIndex) {
      return <div className={props.className}>{props.children}</div>;
   }
}

SettingsTab.Tab = Tab;
SettingsTab.List = List;
SettingsTab.Panels = Panels;
SettingsTab.Panel = Panel;
