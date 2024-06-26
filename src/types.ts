import { ReactNode, HTMLInputTypeAttribute } from "react";
import { SettingsContextType } from "./contexts/settingsContext";
import { Placement } from "@floating-ui/react";
import { APIDMChannel, APIGroupDMChannel, APIRelationUser, RelationshipType } from "@shared/api-types";

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
   background: string;
   secondary: string;
   tertiary: string;
   primary: string;
   accent: string;
   accent2: string;
   success: string;
   text: string;
   error: string;
};

export type ThemeType = "cerulean" | "pine green" | "eggplant" | "coffee" | "charcoal";

export type TooltipOptions = {
   initialOpen?: boolean;
   placement?: Placement;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
};

export type ContextMenuProps = {
   label?: string;
   children?: ReactNode;
   close?: () => void;
} & ContextMenuStateProps;

export type ContextMenuStateProps<T = unknown> = {
   data?: T;
   isOpen?: boolean;
   position?: [number, number];
};

export type ContextMenuItemProps = {
   label: string;
   disabled?: boolean;
};

export type ContextMenuRelationship = { user: APIRelationUser; type: RelationshipType };
export type ContextMenuDMChannel = APIDMChannel | APIGroupDMChannel;

export enum ContextMenuType {
   DM_CHANNEL,
   RELATIONSHIP_MORE,
   RELATIONSHIP,
}
