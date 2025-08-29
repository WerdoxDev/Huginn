import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import { useFilesStore } from "@stores/filesStore";
import { ceruleanTheme, charcoalTheme, coffeeTheme, eggplantTheme, pineGreenTheme, useTheme } from "@stores/themeStore";
import type { DropdownItem, SettingsTabProps, ThemeType } from "@/types";

const themes: DropdownItem[] = [
   { text: "Pine Green", value: "pine green", icon: <ThemeIcon color={pineGreenTheme["primary-500"]} /> },
   { text: "Cerulean", value: "cerulean", icon: <ThemeIcon color={ceruleanTheme["primary-500"]} /> },
   { text: "Eggplant", value: "eggplant", icon: <ThemeIcon color={eggplantTheme["primary-500"]} /> },
   { text: "Coffee", value: "coffee", icon: <ThemeIcon color={coffeeTheme["primary-500"]} /> },
   { text: "Charcoal", value: "charcoal", icon: <ThemeIcon color={charcoalTheme["primary-500"]} /> },
];

export default function SettingsThemeTab(props: SettingsTabProps) {
   const settings = useFilesStore();
   // const { setTheme } = useTheme();

   function onThemeChange(item: DropdownItem) {
      // setTheme(item.value as ThemeType);
      props.onChange?.({ theme: item.value as ThemeType });
   }

   return (
      <div className="flex flex-col gap-y-6">
         <HuginnDropdown onChange={onThemeChange} defaultValue={themes.find((x) => x.value === settings.settings.theme)}>
            <HuginnDropdown.Label>Color Theme</HuginnDropdown.Label>
            <HuginnDropdown.List className="w-52">
               <HuginnDropdown.ItemsWrapper className="w-52">
                  {themes.map((x) => (
                     <HuginnDropdown.Item key={x.value} item={x} />
                  ))}
               </HuginnDropdown.ItemsWrapper>
            </HuginnDropdown.List>
         </HuginnDropdown>
      </div>
   );
}

function ThemeIcon(props: { color: string }) {
   return <div className="h-6 w-6 rounded-md" style={{ background: props.color }} />;
}
