import { DropboxItem, SettingsTabProps, ThemeType } from "@/types";
import HuginnDropbox from "@components/HuginnDropbox";
import { useThemeDispather } from "@contexts/themeContext";

const themes: DropboxItem[] = [
   { id: 0, name: "Pine Green", value: "pine green" },
   { id: 1, name: "Cerulean", value: "cerulean" },
   { id: 2, name: "Eggplant", value: "eggplant" },
   { id: 3, name: "Coffee", value: "coffee" },
   { id: 4, name: "Charcoal", value: "charcoal" },
];

export default function SettingsThemeTab(props: SettingsTabProps) {
   const themeDispatch = useThemeDispather();

   function onChange(item: DropboxItem) {
      themeDispatch(item.value as ThemeType);
      props.onChange && props.onChange({ theme: item.value as ThemeType });
   }

   return (
      <>
         <HuginnDropbox items={themes} onChange={onChange} defaultIndex={themes.findIndex(x => x.value === props.settings.theme)}>
            <HuginnDropbox.Label>Color Theme</HuginnDropbox.Label>
         </HuginnDropbox>
      </>
   );
}
