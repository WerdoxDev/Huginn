import { HuginnIcon as SharedHuginnIcon, type HuginnIconProps, type HuginnIconTheme } from "@huginn/frontend-shared";
import { useTheme } from "@stores/themeStore";

type Props = Omit<HuginnIconProps, "themeType"> & {
   overrideTheme?: HuginnIconTheme;
};

export default function HuginnIcon({ overrideTheme, ...props }: Props) {
   const { themeType } = useTheme();
   return <SharedHuginnIcon {...props} themeType={overrideTheme ?? themeType} />;
}
