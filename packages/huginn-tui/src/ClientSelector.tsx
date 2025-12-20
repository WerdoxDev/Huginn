import { useEffect, useMemo, useState } from "react";
import type { ClientFile, ClientFileWithUser, DateDirectory } from "./types";
import { TextAttributes, type SelectOption } from "@opentui/core";
import { fetchPosthogUserInfo } from "./api";

// For separating client id from file number in a log file name
const regex = /^([0-9a-fA-F-]+)-(\d+)\.json$/;

export default function ClientSelector(props: { dateDirectory: DateDirectory; onSelect: (index: number, options: SelectOption | null) => void }) {
   const [clientFilesWithUsers, setClientFilesWithUsers] = useState<ClientFileWithUser[]>([]);

   const clientFiles = useMemo(
      () =>
         Object.values(
            props.dateDirectory.subDirectories.reduce(
               (acc, file) => {
                  const match = file.match(regex);
                  if (!match) return acc;

                  const uuid = match[1];
                  if (!uuid) return acc;

                  acc[uuid] ??= { clientId: uuid, numOfFiles: 0, directory: props.dateDirectory.name };
                  acc[uuid].numOfFiles++;

                  return acc;
               },
               {} as Record<string, ClientFile>,
            ),
         ),
      [props.dateDirectory],
   );

   useEffect(() => {
      setClientFilesWithUsers(clientFiles.map((x) => ({ ...x, isLoading: true })));

      Promise.all(
         clientFiles.map(async (clientFile) => {
            try {
               const info = await fetchPosthogUserInfo(clientFile.clientId);
               return { ...clientFile, username: info.username, isLoading: false };
            } catch (e) {
               return { ...clientFile, isLoading: false, error: e instanceof Error ? e.message : "Unknown Error" };
            }
         }),
      ).then((r) => setClientFilesWithUsers(r));
   }, [clientFiles]);

   const options = useMemo<SelectOption[]>(
      () =>
         clientFilesWithUsers.map((x) => ({
            name: x.clientId,
            value: x,
            description: x.isLoading
               ? "Loading user..."
               : x.error
                 ? `Error: ${x.error}`
                 : `${x.username || "Unknown user"} • ${x.numOfFiles} file(s)`,
         })),
      [clientFilesWithUsers],
   );

   function onSelect(index: number, option: SelectOption | null) {
      if (!option || option.value.isLoading) return;

      props.onSelect(index, option);
   }

   return (
      <box>
         <text style={{ alignSelf: "flex-start", attributes: TextAttributes.BOLD | TextAttributes.DIM, marginTop: 3 }}>Choose a Client ID:</text>
         <box style={{ border: true, height: "100%", borderStyle: "rounded" }}>
            <select
               options={options}
               onSelect={onSelect}
               style={{
                  height: "100%",
                  width: 100,
                  backgroundColor: "#303030",
                  showScrollIndicator: true,
                  focusedTextColor: "#EBEBD3",
                  selectedTextColor: "#00dabd",
                  showDescription: true,
               }}
               focused
            />
         </box>
      </box>
   );
}
