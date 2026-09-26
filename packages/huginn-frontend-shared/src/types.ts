import type { ReactNode } from "react";

export type HuginnStatus = "none" | "default" | "error" | "success";

export type HuginnInputMessage = {
   status: HuginnStatus;
   text: string;
};

export type HuginnSelectItem<T = string> = {
   text: string;
   icon?: ReactNode;
   value: T;
};

export type ColorTheme = {
   surface: string;
   "surface-alt": string;
   "surface-deep": string;
   "surface-void": string;
   text: string;

   "primary-300": string;
   "primary-400": string;
   "primary-500": string;
   "primary-600": string;
   "primary-700": string;
   "primary-800": string;
   "primary-900": string;

   "positive-100": string;
   "positive-300": string;
   "positive-500": string;
   "positive-700": string;
   "positive-900": string;

   "negative-100": string;
   "negative-300": string;
   "negative-500": string;
   "negative-700": string;
   "negative-900": string;

   "caution-100": string;
   "caution-300": string;
   "caution-500": string;
   "caution-700": string;
   "caution-900": string;
};
