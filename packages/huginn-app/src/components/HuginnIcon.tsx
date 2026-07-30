import type { ThemeType } from "@huginnjs/shared";

import { useTheme } from "@stores/themeStore";
import clsx from "clsx";
import { useMemo, type Ref } from "react";

import ceruleanOutlinedUrl from "@/assets/icons/cerulean/outline/outline-512.png";
import ceruleanUrl from "@/assets/icons/cerulean/stacked/stacked-512.png";
import coffeeOutlinedUrl from "@/assets/icons/coffee/outline/outline-512.png";
import coffeeUrl from "@/assets/icons/coffee/stacked/stacked-512.png";
import defaultOutlinedUrl from "@/assets/icons/default/outline/outline-512.png";
import defaultUrl from "@/assets/icons/default/stacked/stacked-512.png";
import pineGreenOutlinedUrl from "@/assets/icons/pine-green/outline/outline-512.png";
import pineGreenUrl from "@/assets/icons/pine-green/stacked/stacked-512.png";
import plumOutlinedUrl from "@/assets/icons/plum/outline/outline-512.png";
import plumUrl from "@/assets/icons/plum/stacked/stacked-512.png";
import roseOutlinedUrl from "@/assets/icons/rose/outline/outline-512.png";
import roseUrl from "@/assets/icons/rose/stacked/stacked-512.png";
import violetOutlinedUrl from "@/assets/icons/violet/outline/outline-512.png";
import violetUrl from "@/assets/icons/violet/stacked/stacked-512.png";

type ModifiedThemeType = ThemeType | "default";

const iconSources: Record<ModifiedThemeType, string[]> = {
   cerulean: [ceruleanUrl, ceruleanOutlinedUrl],
   "pine-green": [pineGreenUrl, pineGreenOutlinedUrl],
   plum: [plumUrl, plumOutlinedUrl],
   coffee: [coffeeUrl, coffeeOutlinedUrl],
   violet: [violetUrl, violetOutlinedUrl],
   rose: [roseUrl, roseOutlinedUrl],
   default: [defaultUrl, defaultOutlinedUrl],
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
