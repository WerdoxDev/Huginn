import type { SettingsTabProps } from "@/types";

import ColorThemeSelector from "./ColorThemeSelector";
import DefaultChannelBackgroundSelector from "./DefaultChannelBackgroundSelector";

export default function SettingsThemeTab(props: SettingsTabProps) {
   return (
      <div className="flex w-full flex-col items-center">
         <div className="flex w-full max-w-md flex-col items-center gap-8">
            <ColorThemeSelector onChange={props.onChange} />
            <DefaultChannelBackgroundSelector />
         </div>
      </div>
   );
}
