import { ReactNode, HTMLInputTypeAttribute } from "react";
import { SettingsContextType } from "./contexts/settingsContext";

export type StatusCode = "none" | "default" | "error" | "success";

export type LoadingState = "none" | "loading" | "checking_update" | "updating" | "test";

export type InputStatus = {
   code: StatusCode;
   text: string;
};

export type InputValue = {
   required: boolean;
   value: string;
};

export type InputOptions = {
   name: string;
   required: boolean;
   default?: string;
};

export type InputProp = {
   status: InputStatus;
   value: string;
   required: boolean;
   onChange: (e: HTMLInputElement) => void;
};

export type InputStatuses = Record<string, InputStatus>;
export type InputValues = Record<string, InputValue>;
export type InputProps = Record<string, InputProp>;

export type MessageDetail = {
   status: StatusCode;
   text: string;
   visible: boolean;
};

export type HuginnInputProps = {
   children?: ReactNode;
   className?: string;
   status: InputStatus;
   type?: HTMLInputTypeAttribute;
   required?: boolean;
   value?: string;
   hideBorder?: boolean;
   onChange?: (e: HTMLInputElement) => void;
   onFocus?: (focused: boolean) => void;
};

export type HuginnButtonProps = {
   children?: ReactNode;
   type?: "submit" | "reset" | "button" | undefined;
   className?: string;
   disabled?: boolean;
   innerClassName?: string;
   onClick?: () => void;
};

export type ModalState = {
   isOpen: boolean;
};

export type InfoModalState = {
   state: StatusCode;
   text: string;
} & ModalState;

export type UpdaterProgress = {
   chunkLength: number;
   contentLength: number;
};

export type SettingsTab = {
   name: string;
   text: string;
   children?: SettingsTab[];
   icon?: ReactNode;
   component?: (props: SettingsTabProps) => JSX.Element;
};

export type SettingsTabProps = {
   settings: DeepPartial<SettingsContextType>;
   onChange?: (value: DeepPartial<SettingsContextType>) => void;
};

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type DropboxItem = {
   id: number;
   name: string;
   value: string;
};

export type ColorTheme = {
   background: [string, string];
   secondary: [string, string];
   tertiary: [string, string];
   primary: [string, string];
   accent: [string, string];
   accent2: [string, string];
   success: [string, string];
   text: [string, string];
   error: [string, string];
};

export type ThemeType = "cerulean" | "pine green" | "eggplant";
