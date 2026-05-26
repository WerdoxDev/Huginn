import { useTheme } from "@stores/themeStore";
import clsx from "clsx";
import { useMemo, type Ref } from "react";

import type { ThemeType } from "@/types";

import ceruleanUrl from "@/assets/icons/cerulean.png";
import ceruleanOutlinedUrl from "@/assets/icons/cerulean_outline.png";
import charcoalUrl from "@/assets/icons/charcoal.png";
import charcoalOutlinedUrl from "@/assets/icons/charcoal_outline.png";
import coffeeUrl from "@/assets/icons/coffee.png";
import coffeeOutlinedUrl from "@/assets/icons/coffee_outline.png";
import eggplantUrl from "@/assets/icons/eggplant.png";
import eggplantOutlinedUrl from "@/assets/icons/eggplant_outline.png";
import pinegreenUrl from "@/assets/icons/pinegreen.png";
import pinegreenOutlinedUrl from "@/assets/icons/pinegreen_outline.png";
import scarletUrl from "@/assets/icons/scarlet.png";
import scarletOutlinedUrl from "@/assets/icons/scarlet_outline.png";
import textUrl from "@/assets/icons/text.png";
import textOutlinedUrl from "@/assets/icons/text_outline.png";

type ModifiedThemeType = ThemeType | "text";

const iconSources: Record<ModifiedThemeType, string[]> = {
   cerulean: [ceruleanUrl, ceruleanOutlinedUrl],
   "pine-green": [pinegreenUrl, pinegreenOutlinedUrl],
   eggplant: [eggplantUrl, eggplantOutlinedUrl],
   coffee: [coffeeUrl, coffeeOutlinedUrl],
   charcoal: [charcoalUrl, charcoalOutlinedUrl],
   scarlet: [scarletUrl, scarletOutlinedUrl],
   text: [textUrl, textOutlinedUrl],
};

export default function HuginnIcon(props: {
   className?: string;
   overrideTheme?: ModifiedThemeType;
   outlined?: boolean;
   ref?: Ref<HTMLImageElement>;
   onClick?: () => void;
}) {
   const theme = useTheme();
   const source = useMemo(() => iconSources[props.overrideTheme ?? theme.themeType], [props.overrideTheme, theme.themeType]);

   return <img alt="huginn-icon" src={source?.[props.outlined ? 1 : 0]} className={clsx(props.className)} ref={props.ref} onClick={props.onClick} />;
}
