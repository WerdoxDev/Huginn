import type { ComponentPropsWithRef } from "react";

import ceruleanOutlinedUrl from "@huginn/assets/icons/cerulean/outline/outline-512.png";
import ceruleanUrl from "@huginn/assets/icons/cerulean/stacked/stacked-512.png";
import coffeeOutlinedUrl from "@huginn/assets/icons/coffee/outline/outline-512.png";
import coffeeUrl from "@huginn/assets/icons/coffee/stacked/stacked-512.png";
import defaultOutlinedUrl from "@huginn/assets/icons/default/outline/outline-512.png";
import defaultUrl from "@huginn/assets/icons/default/stacked/stacked-512.png";
import pineGreenOutlinedUrl from "@huginn/assets/icons/pine-green/outline/outline-512.png";
import pineGreenUrl from "@huginn/assets/icons/pine-green/stacked/stacked-512.png";
import plumOutlinedUrl from "@huginn/assets/icons/plum/outline/outline-512.png";
import plumUrl from "@huginn/assets/icons/plum/stacked/stacked-512.png";
import roseOutlinedUrl from "@huginn/assets/icons/rose/outline/outline-512.png";
import roseUrl from "@huginn/assets/icons/rose/stacked/stacked-512.png";
import violetOutlinedUrl from "@huginn/assets/icons/violet/outline/outline-512.png";
import violetUrl from "@huginn/assets/icons/violet/stacked/stacked-512.png";

import type { ColorThemeType } from "../lib/theme";

export type HuginnIconTheme = ColorThemeType | "default";

const iconSources: Record<HuginnIconTheme, readonly [string, string]> = {
   cerulean: [ceruleanUrl, ceruleanOutlinedUrl],
   "pine-green": [pineGreenUrl, pineGreenOutlinedUrl],
   plum: [plumUrl, plumOutlinedUrl],
   coffee: [coffeeUrl, coffeeOutlinedUrl],
   violet: [violetUrl, violetOutlinedUrl],
   rose: [roseUrl, roseOutlinedUrl],
   default: [defaultUrl, defaultOutlinedUrl],
};

export type HuginnIconProps = Omit<ComponentPropsWithRef<"img">, "src"> & {
   themeType?: HuginnIconTheme;
   outlined?: boolean;
};

export default function HuginnIcon({ themeType = "default", outlined = false, alt = "huginn-icon", ...props }: HuginnIconProps) {
   return <img {...props} alt={alt} src={iconSources[themeType][outlined ? 1 : 0]} />;
}
