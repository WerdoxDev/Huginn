import { DropboxItem, SettingsTabProps, ThemeType } from "@/types";
import HuginnDropbox from "@components/HuginnDropbox";
import { ceruleanTheme, charcoalTheme, coffeeTheme, eggplantTheme, pineGreenTheme, useThemeDispather } from "@contexts/themeContext";

function ThemeIcon(props: { color: string }) {
   return <div className="h-6 w-6 rounded-md" style={{ background: props.color }}></div>;
}

const themes: DropboxItem[] = [
   { id: 0, name: "Pine Green", value: "pine green", icon: <ThemeIcon color={pineGreenTheme.primary} /> },
   { id: 1, name: "Cerulean", value: "cerulean", icon: <ThemeIcon color={ceruleanTheme.primary} /> },
   { id: 2, name: "Eggplant", value: "eggplant", icon: <ThemeIcon color={eggplantTheme.primary} /> },
   { id: 3, name: "Coffee", value: "coffee", icon: <ThemeIcon color={coffeeTheme.primary} /> },
   { id: 4, name: "Charcoal", value: "charcoal", icon: <ThemeIcon color={charcoalTheme.primary} /> },
];

export default function SettingsThemeTab(props: SettingsTabProps) {
   const themeDispatch = useThemeDispather();

   function onChange(item: DropboxItem) {
      themeDispatch(item.value as ThemeType);
      props.onChange && props.onChange({ theme: item.value as ThemeType });
   }

   return (
      <HuginnDropbox items={themes} onChange={onChange} defaultIndex={themes.findIndex(x => x.value === props.settings.theme)}>
         <HuginnDropbox.Label>Color Theme</HuginnDropbox.Label>
      </HuginnDropbox>
   );
}
