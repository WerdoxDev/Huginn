import { LOG_VALUES_MAP, type LogArgs } from "@huginn/shared";
import { TextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import moment from "moment";
import path from "node:path";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ClientFileWithUser } from "./types";

import { baseDir } from ".";
import MultiSelect from "./MultiSelect";

type LogHeader = {
   clientId: string;
   timestamp: string;
   systemInfo: {
      platform: string;
      arch: string;
      version: string;
      release: string;
      appVersion: string;
   };
   geoData: {
      country: string;
      city: string;
      timezone: string;
      region: string;
      org: string;
      ip: string;
   };
   logs: Array<LogEntry>;
   headerIndex: number; // Index of this header in the headers array
};

type LogEntry = {
   type: "log" | "error";
   timestamp: string;
   section: string;
   level: string;
   args: LogArgs[];
   id: number; // Global entry ID
   headerIndex: number; // Index of parent header
};

const MAX_TAB_INDEX = 1;
const READ_LOGS_INTERVAL = 1000;

export function LogViewer(props: { clientFile: ClientFileWithUser }) {
   const logWrapper = useRef<ScrollBoxRenderable | null>(null);
   const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
   const [logHeaders, setLogHeaders] = useState<LogHeader[]>([]);
   const [maxPageSize, setMaxPageSize] = useState(0);
   const [page, setPage] = useState({ index: 0, totalLogs: 0, start: 0, end: 0 });
   const [selectedSections, setSelectedSections] = useState<Record<string, string[]>>({});
   const [selectedErrors, setSelectedErrors] = useState<Record<string, string[]>>({});
   const [tabIndex, setTabIndex] = useState(0);
   const [panelIndex, setPanelIndex] = useState(0);
   const [isSticky, setIsSticky] = useState(false);

   const sections = { ...LOG_VALUES_MAP } as unknown as Record<string, string[]>;
   const errors = Object.fromEntries(Object.keys(LOG_VALUES_MAP).map((x) => [x, [""] as string[]]));

   const filteredLogEntries = useMemo(() => {
      const sections = Object.keys(selectedSections);
      const errors = Object.keys(selectedErrors);
      const filtered = logEntries.filter(
         (x) =>
            (errors.includes(x.section) && x.type === "error") ||
            (sections.includes(x.section) && selectedSections[x.section]?.includes(x.level) && x.type === "log"),
      );
      return filtered;
   }, [logEntries, selectedSections, selectedErrors]);

   const maxPages = maxPageSize === 0 ? 0 : Math.ceil(filteredLogEntries.length / maxPageSize);

   useEffect(() => {}, [filteredLogEntries]);

   useEffect(() => {
      if (!logWrapper.current) return;
      setMaxPageSize((logWrapper.current?.height ?? 0) - 2);

      logWrapper.current.onSizeChange = () => {
         setMaxPageSize((logWrapper.current?.height ?? 0) - 2);
      };
   }, []);

   useEffect(() => {
      if (isSticky) {
         setPage(() => {
            const newIndex = Math.max(0, Math.ceil(filteredLogEntries.length / maxPageSize) - 1);

            const newStart = newIndex * maxPageSize;
            const newEnd = Math.min(newStart + maxPageSize, filteredLogEntries.length);
            return { index: newIndex, totalLogs: newEnd - newStart, start: newStart, end: newEnd };
         });
         return;
      }
      setPage((prev) => {
         if (maxPageSize === 0) return prev;

         if (filteredLogEntries.length === 0) {
            return { index: 0, totalLogs: 0, start: 0, end: 0 };
         }

         const currentMidpoint = Math.floor((prev.start + prev.end) / 2);

         let newIndex = Math.floor(currentMidpoint / maxPageSize);
         const maxValidIndex = Math.max(0, Math.ceil(filteredLogEntries.length / maxPageSize) - 1);
         newIndex = Math.min(newIndex, maxValidIndex);

         const newStart = newIndex * maxPageSize;
         const newEnd = Math.min(newStart + maxPageSize, filteredLogEntries.length);

         return {
            index: newIndex,
            totalLogs: newEnd - newStart,
            start: newStart,
            end: newEnd,
         };
      });
   }, [maxPageSize, filteredLogEntries]);

   useKeyboard((key) => {
      if (key.name === "1") {
         setPanelIndex(0);
      } else if (key.name === "2") {
         setPanelIndex(1);
      }

      if (panelIndex === 1) {
         if (key.name === "right") {
            handlePagination("next");
         } else if (key.name === "left") {
            handlePagination("previous");
         }
      }

      if (panelIndex === 0) {
         if (key.name === "tab") {
            if (key.shift) {
               setTabIndex((old) => (old <= 0 ? MAX_TAB_INDEX : old - 1));
            } else {
               setTabIndex((old) => (old === MAX_TAB_INDEX ? 0 : old + 1));
            }
         }
      }

      if (key.name === "s") {
         setIsSticky((old) => !old);
      }
   });

   function handlePagination(direction: "next" | "previous") {
      setPage((prev) => {
         if (direction === "previous" && page.index <= 0) return prev;
         if (direction === "next" && page.index >= maxPages - 1) return prev;

         if (direction === "next") {
            const newStart = prev.end;
            const newEnd = Math.min(newStart + maxPageSize, filteredLogEntries.length);
            return {
               index: prev.index + 1,
               totalLogs: newEnd - newStart,
               start: newStart,
               end: newEnd,
            };
         }

         if (direction === "previous") {
            const newStart = Math.max(prev.start - maxPageSize, 0);
            const newEnd = prev.start;
            return {
               index: prev.index - 1,
               totalLogs: newEnd - newStart,
               start: newStart,
               end: newEnd,
            };
         }

         return prev;
      });
   }

   async function getLogs() {
      if (!baseDir) return { headers: [], entries: [] };

      const logHeaders: LogHeader[] = [];
      const t0 = performance.now();

      // Load all log files
      for (let i = 0; i < props.clientFile.numOfFiles; i++) {
         const content: LogHeader[] = await Bun.file(
            path.join(baseDir, props.clientFile.directory, `${props.clientFile.clientId}-${i + 1}.json`),
         ).json();
         logHeaders.push(...content);
      }

      const t1 = performance.now();
      console.log("Took ", t1 - t0, "ms to load file(s)");

      // Assign indices to headers and their entries
      const allEntries: LogEntry[] = [];
      let globalEntryId = 0;

      for (let headerIdx = 0; headerIdx < logHeaders.length; headerIdx++) {
         const header = logHeaders[headerIdx]!;
         header.headerIndex = headerIdx; // Assign header index

         for (const entry of header.logs) {
            entry.id = globalEntryId; // Global entry ID
            entry.headerIndex = headerIdx; // Link back to header
            allEntries.push(entry);
            globalEntryId++;
         }
      }

      return { entries: allEntries, headers: logHeaders };
   }

   useEffect(() => {
      const interval = setInterval(() => {
         getLogs().then((r) => {
            setLogEntries(r.entries);
            setLogHeaders(r.headers);
            // const end = Math.min(maxPageSize, r.);
            // setPage({ start: 0, end: end, totalLogs: end, index: 0 });
         });
      }, READ_LOGS_INTERVAL);

      return () => {
         clearInterval(interval);
      };
   }, [props.clientFile]);

   const visibleLogs = filteredLogEntries.slice(page.start, page.end);

   return (
      <box
         style={{
            width: "100%",
            height: "100%",
            border: false,
            marginTop: 3,
            flexDirection: "row",
         }}
      >
         <box
            style={{
               border: true,
               flexShrink: 0,
               borderStyle: "rounded",
               borderColor: panelIndex === 0 ? "#00dabd" : undefined,
            }}
         >
            <MultiSelect
               style={{
                  focusedTextColor: "#00dabd",
                  focusedHintTextColor: "#008c7d",
                  selectedIndicatorColor: "#76ff7a",
                  selectedTextColor: "#76ff7a",
               }}
               label="Section Filter"
               options={sections}
               focused={tabIndex === 0 && panelIndex === 0}
               onChange={setSelectedSections}
            />
            <MultiSelect
               style={{
                  focusedTextColor: "#00dabd",
                  focusedHintTextColor: "#008c7d",
                  selectedIndicatorColor: "#76ff7a",
                  selectedTextColor: "#76ff7a",
               }}
               label="Errors Filter"
               options={errors}
               focused={tabIndex === 1 && panelIndex === 0}
               onChange={setSelectedErrors}
            />
            {/* <MultiSelect
               disabled={selectedSections.length === 0}
               style={{
                  focusedTextColor: "#00dabd",
                  focusedHintTextColor: "#008c7d",
                  selectedIndicatorColor: "#76ff7a",
                  selectedTextColor: "#76ff7a",
               }}
               label="Level"
               options={Array.from(
                  Object.entries(LOG_VALUES_MAP)
                     .filter((x) => selectedSections.includes(x[0]))
                     .map((x) => x[1]),
               )}
               focused={tabIndex === 1}
            /> */}
         </box>
         {/* <box style={{ border: true, flexShrink: 0 }}>
            <box style={{ flexDirection: "row" }}>
               <text>Section: </text>
               <box style={{ backgroundColor: "black", maxWidth: 35 }}>
                  <text>{Object.keys(LOG_VALUES_MAP).join("\n")}</text>
               </box>
            </box>
         </box> */}
         <box style={{ flexDirection: "row", width: "100%" }}>
            <box style={{ flexDirection: "column", width: "100%" }}>
               <box
                  style={{
                     marginRight: 2,
                     marginLeft: 0,
                     height: "100%",
                     width: "100%",
                     border: true,
                     borderStyle: "rounded",
                     borderColor: panelIndex === 1 ? "#00dabd" : undefined,
                  }}
                  ref={logWrapper}
               >
                  {visibleLogs.map((x) => (
                     <box style={{ height: 1, border: false, flexDirection: "row", columnGap: 1 }} key={x.id}>
                        <text style={{ flexShrink: 0, fg: "gray" }}>{moment(x.timestamp).format("MM.DD.YYYY HH:mm:ss")}</text>
                        <text style={{ fg: x.type === "log" ? "#76ff7a" : "#fa8072", flexShrink: 0 }}>{x.type}</text>
                        <text style={{ fg: "#00dabd", flexShrink: 0 }}>{x.section}</text>
                        {x.type === "log" && <text style={{ fg: "white", flexShrink: 0 }}>{x.level}</text>}
                        <text style={{ fg: "#EBEBD3", wrapMode: "none" }}>
                           {x.args.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(" ")}
                        </text>
                     </box>
                  ))}
               </box>
               <box style={{ height: 2, paddingLeft: 2, flexDirection: "row", columnGap: 5 }}>
                  <text>
                     Page: {maxPages === 0 ? 0 : page.index + 1}/{maxPages}
                  </text>
                  <text>Showing: {page.totalLogs}</text>
                  <text>Sticky: {isSticky ? "Enabled" : "Disabled"} (s)</text>
               </box>
            </box>
            <box style={{ flexShrink: 0, border: true, borderStyle: "rounded" }}>
               {(() => {
                  const header = logHeaders.find((x) => x.headerIndex === visibleLogs[0]?.headerIndex);
                  if (!header) return <text>No header found</text>;

                  return (
                     <box style={{ flexDirection: "column" }}>
                        <text style={{ attributes: TextAttributes.BOLD }}>Client Info</text>
                        <box style={{ marginLeft: 2 }}>
                           <text>
                              Client ID: <span style={{ fg: "gray" }}>{header.clientId}</span>
                           </text>
                           <text>
                              Username: <span style={{ fg: "gray" }}>{props.clientFile.username ?? "unknown"}</span>
                           </text>
                           <text>
                              Date: <span style={{ fg: "gray" }}>{props.clientFile.directory ?? "unknown"}</span>
                           </text>
                           <text>
                              Last Timestamp: <span style={{ fg: "gray" }}>{moment(header.timestamp).format("MM.DD.YYYY HH:mm:ss")}</span>
                           </text>
                        </box>

                        {header.geoData && (
                           <>
                              <text style={{ attributes: TextAttributes.BOLD, marginTop: 1 }}>Location</text>
                              <box style={{ marginLeft: 2 }}>
                                 <text>
                                    IP: <span style={{ fg: "gray" }}>{header.geoData.ip}</span>
                                 </text>
                                 <text>
                                    Country: <span style={{ fg: "gray" }}>{header.geoData.country ?? "unknown"}</span>
                                 </text>
                                 <text>
                                    Region: <span style={{ fg: "gray" }}>{header.geoData.region ?? "unknown"}</span>
                                 </text>
                                 <text>
                                    City: <span style={{ fg: "gray" }}>{header.geoData.city ?? "unknown"}</span>
                                 </text>
                                 <text>
                                    Timezone: <span style={{ fg: "gray" }}>{header.geoData.timezone ?? "unknown"}</span>
                                 </text>
                                 <text>
                                    Org: <span style={{ fg: "gray" }}>{header.geoData.org ?? "unknown"}</span>
                                 </text>
                              </box>
                           </>
                        )}

                        <text style={{ attributes: TextAttributes.BOLD, marginTop: 1 }}>System</text>
                        <box style={{ marginLeft: 2 }}>
                           <text>
                              Platform: <span style={{ fg: "gray" }}>{header.systemInfo.platform}</span>
                           </text>
                           <text>
                              Arch: <span style={{ fg: "gray" }}>{header.systemInfo.arch}</span>
                           </text>
                           <text>
                              Version: <span style={{ fg: "gray" }}>{header.systemInfo.version}</span>
                           </text>
                           <text>
                              Release: <span style={{ fg: "gray" }}>{header.systemInfo.release}</span>
                           </text>
                           <text>
                              App Version: <span style={{ fg: "gray" }}>{header.systemInfo.appVersion}</span>
                           </text>
                        </box>
                     </box>
                  );
               })()}
            </box>
         </box>
      </box>
   );
}
