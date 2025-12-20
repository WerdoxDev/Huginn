import { TextAttributes, type SelectOption } from "@opentui/core";
import type { DateDirectory } from "./types";
import { useMemo } from "react";

export default function DateSelector(props: { dateDirectories: DateDirectory[]; onSelect: (index: number, option: SelectOption | null) => void }) {
   const options = useMemo<SelectOption[]>(
      () =>
         props.dateDirectories.map((x) => ({
            name: x.name,
            value: x,
            description: `${x.subDirectories.length} log files`,
         })),
      [props.dateDirectories],
   );

   return (
      <box>
         <text style={{ alignSelf: "flex-start", attributes: TextAttributes.BOLD | TextAttributes.DIM, marginTop: 3 }}>Choose a Date:</text>
         <box style={{ border: true, height: "100%", borderStyle: "rounded" }}>
            <select
               options={options}
               onSelect={props.onSelect}
               style={{
                  height: "100%",
                  width: 50,
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
