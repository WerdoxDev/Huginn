import { readEnv } from "@huginn/runtime-shared";
import { createCliRenderer, type SelectOption } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { useState } from "react";

import type { ClientFileWithUser, DateDirectory } from "./types";

import ClientSelector from "./ClientSelector";
import DateSelector from "./DateSelector";
import { LogViewer } from "./LogViewer";

export const envs = readEnv(["POSTHOG_PROJECT_ID", "POSTHOG_PERSONAL_API_KEY"] as const);

export const baseDir = Bun.argv[2];
let dateDirectories: DateDirectory[] = [];
if (baseDir) {
   dateDirectories = (await readdir(baseDir)).map((x) => ({ name: x, subDirectories: [] }));
   for (const dir of dateDirectories) {
      dir.subDirectories = await readdir(path.join(baseDir, dir.name));
   }
}

function App() {
   const [selectedDate, setSelectedDate] = useState<DateDirectory>();
   const [selectedClient, setSelectedClient] = useState<ClientFileWithUser>();
   const renderer = useRenderer();

   useKeyboard((key) => {
      if (key.name === "escape") {
         if (selectedClient) setSelectedClient(undefined);
         else if (selectedDate) setSelectedDate(undefined);
         else {
            renderer.destroy();
            process.exit();
         }
      } else if (key.ctrl && key.name === "d") {
         renderer.console.toggle();
      }
   });

   function onDateSelect(index: number, option: SelectOption | null) {
      if (!option) return;

      setSelectedDate(option.value);
   }

   function onClientSelect(index: number, option: SelectOption | null) {
      if (!option) return;

      setSelectedClient(option.value);
   }

   return (
      <box
         style={{
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: 2,
            backgroundColor: "#1f1f1f",
            flexGrow: 1,
         }}
      >
         <box style={{ justifyContent: "flex-start", alignItems: "center", width: "100%" }}>
            <box style={{ flexDirection: "row", columnGap: 5 }}>
               <ascii-font font="block" text="Huginn" color="#EBEBD3" />
               <ascii-font font="block" text="TUI" color="#5ecc62" />
            </box>

            {!selectedDate && <DateSelector dateDirectories={dateDirectories} onSelect={onDateSelect} />}
            {selectedDate && !selectedClient && <ClientSelector dateDirectory={selectedDate} onSelect={onClientSelect} />}
            {selectedDate && selectedClient && <LogViewer clientFile={selectedClient} />}
         </box>
      </box>
   );
}

const renderer = await createCliRenderer({ consoleOptions: { sizePercent: 60 } });
createRoot(renderer).render(<App />);

console.log(dateDirectories);
