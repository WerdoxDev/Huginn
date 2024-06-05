import { useThemeDispather } from "../../contexts/themeContext";
import HuginnDropbox from "../HuginnDropbox";

const themes: DropboxItem[] = [
   { id: 0, name: "Teal", value: "teal" },
   { id: 1, name: "Pine Green", value: "pine green" },
   { id: 2, name: "Cerulean", value: "cerulean" },
   { id: 3, name: "Eggplant", value: "eggplant" },
];

export default function SettingsThemeTab(props: SettingsTabProps) {
   const themeDispatch = useThemeDispather();

   function onChange(item: DropboxItem) {
      themeDispatch(item.value as ThemeType);
      props.onChange && props.onChange({ theme: item.value as ThemeType });
   }

   return (
      <>
         <HuginnDropbox items={themes} onChange={onChange} defaultIndex={themes.findIndex((x) => x.value === props.settings.theme)}>
            <HuginnDropbox.Label>Color Theme</HuginnDropbox.Label>
         </HuginnDropbox>
      </>
   );
}
