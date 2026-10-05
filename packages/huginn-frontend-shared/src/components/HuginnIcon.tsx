import type { ComponentPropsWithRef } from "react";

import ceruleanThickOutlinedUrl from "@huginn/assets/icons/cerulean/outline-thick/outline-thick-512.png";
import ceruleanOutlinedUrl from "@huginn/assets/icons/cerulean/outline/outline-512.png";
import ceruleanUrl from "@huginn/assets/icons/cerulean/stacked/stacked-512.png";
import coffeeThickOutlinedUrl from "@huginn/assets/icons/coffee/outline-thick/outline-thick-512.png";
import coffeeOutlinedUrl from "@huginn/assets/icons/coffee/outline/outline-512.png";
import coffeeUrl from "@huginn/assets/icons/coffee/stacked/stacked-512.png";
import defaultThickOutlinedUrl from "@huginn/assets/icons/default/outline-thick/outline-thick-512.png";
import defaultOutlinedUrl from "@huginn/assets/icons/default/outline/outline-512.png";
import defaultUrl from "@huginn/assets/icons/default/stacked/stacked-512.png";
import pineGreenThickOutlinedUrl from "@huginn/assets/icons/pine-green/outline-thick/outline-thick-512.png";
import pineGreenOutlinedUrl from "@huginn/assets/icons/pine-green/outline/outline-512.png";
import pineGreenUrl from "@huginn/assets/icons/pine-green/stacked/stacked-512.png";
import plumThickOutlinedUrl from "@huginn/assets/icons/plum/outline-thick/outline-thick-512.png";
import plumOutlinedUrl from "@huginn/assets/icons/plum/outline/outline-512.png";
import plumUrl from "@huginn/assets/icons/plum/stacked/stacked-512.png";
import roseThickOutlinedUrl from "@huginn/assets/icons/rose/outline-thick/outline-thick-512.png";
import roseOutlinedUrl from "@huginn/assets/icons/rose/outline/outline-512.png";
import roseUrl from "@huginn/assets/icons/rose/stacked/stacked-512.png";
import violetThickOutlinedUrl from "@huginn/assets/icons/violet/outline-thick/outline-thick-512.png";
import violetOutlinedUrl from "@huginn/assets/icons/violet/outline/outline-512.png";
import violetUrl from "@huginn/assets/icons/violet/stacked/stacked-512.png";

import type { ColorThemeType } from "../lib/theme";

export type HuginnIconTheme = ColorThemeType | "default";

const iconSources: Record<HuginnIconTheme, readonly [string, string, string]> = {
   cerulean: [ceruleanUrl, ceruleanOutlinedUrl, ceruleanThickOutlinedUrl],
   "pine-green": [pineGreenUrl, pineGreenOutlinedUrl, pineGreenThickOutlinedUrl],
   plum: [plumUrl, plumOutlinedUrl, plumThickOutlinedUrl],
   coffee: [coffeeUrl, coffeeOutlinedUrl, coffeeThickOutlinedUrl],
   violet: [violetUrl, violetOutlinedUrl, violetThickOutlinedUrl],
   rose: [roseUrl, roseOutlinedUrl, roseThickOutlinedUrl],
   default: [defaultUrl, defaultOutlinedUrl, defaultThickOutlinedUrl],
};

export type HuginnIconProps = Omit<ComponentPropsWithRef<"img">, "src"> & {
   themeType?: HuginnIconTheme;
   outlined?: boolean;
   thickOutlined?: boolean;
};

export default function HuginnIcon({ themeType = "default", outlined = false, thickOutlined = false, alt = "huginn-icon", ...props }: HuginnIconProps) {
   return <img {...props} alt={alt} src={iconSources[themeType][outlined ? 1 : thickOutlined ? 2 : 0]} />;
}
