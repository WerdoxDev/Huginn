import type { Placement } from "@floating-ui/react";
import type { AddChannelRecipientMutationVars } from "@hooks/mutations/useAddChannelRecipient";
import type { CreateDMChannelMutationVars } from "@hooks/mutations/useCreateDMChannel";
import type { CreateRelationshipMutationVars } from "@hooks/mutations/useCreateRelationship";
import type { PatchDMChannelMutationVars } from "@hooks/mutations/usePatchDMChannel";
import type { RemoveChannelRecipientMutationVars } from "@hooks/mutations/useRemoveChannelRecipient";
import type {
   APIChannelUser, APIMessage, APIPublicUser,
   APIRelationshipWithoutOwner,
   APIRelationUser,
   DeepPartial,
   DirectChannel,
   HMediaKind,
   RelationshipType,
   Snowflake
} from "@huginn/shared";
import type { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import type { AppSettings } from "@stores/settingsStore";
import type { ChangeEvent, HTMLInputTypeAttribute, ReactNode, RefObject } from "react";

export type StatusCode = "none" | "default" | "error" | "success";

export type LoadingState = "none" | "loading" | "checking_update" | "checking_update_failed" | "updating" | "test";

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
   default?: string | null;
   lowercase?: boolean;
};

export type InputProp = {
   status: InputStatus;
   value: string;
   required: boolean;
   onChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
   headless?: boolean;
   className?: string;
   status: InputStatus;
   required?: boolean;
   disabled?: boolean;
   value?: string;
   placeholder?: string;
   type?: HTMLInputTypeAttribute;
   onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
   onFocusChanged?: (focused: boolean) => void;
};

export type HuginnButtonProps = {
   children?: ReactNode;
   type?: "submit" | "reset" | "button" | undefined;
   className?: string;
   disabled?: boolean;
   innerClassName?: string;
   color?: "primary" | "surface-deep" | "surface-alt" | "surface"
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
   auth?: boolean;
   children?: Omit<SettingsTab, "children">[];
   icon?: ReactNode;
   component?: (props: SettingsTabProps) => React.JSX.Element | undefined;
};

export type SettingsTabProps = {
   onChange?: (value: DeepPartial<AppSettings>) => void;
   onSave?: () => Promise<void>;
};

export type DropdownItem = {
   text: string;
   icon?: ReactNode;
   value: string;
};

export type ColorTheme = {
   "surface": string;
   "surface-alt": string;
   "surface-deep": string;

   "primary-300": string;
   "primary-400": string;
   "primary-500": string;
   "primary-600": string;
   "primary-700": string;
   "primary-800": string;
   "primary-900": string;

   "positive-100": string;
   "positive-200": string;
   "positive-300": string;
   "positive-400": string;
   "positive-500": string;
   "positive-600": string;
   "positive-700": string;
   "positive-800": string;
   "positive-900": string;

   "negative-100": string;
   "negative-200": string;
   "negative-300": string;
   "negative-400": string;
   "negative-500": string;
   "negative-600": string;
   "negative-700": string;
   "negative-800": string;
   "negative-900": string;

   "caution-100": string;
   "caution-200": string;
   "caution-300": string;
   "caution-400": string;
   "caution-500": string;
   "caution-600": string;
   "caution-700": string;
   "caution-800": string;
   "caution-900": string;

   "text": string;
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
   renderChildren?: ReactNode;
   children?: ReactNode;
   close?: () => void;
} & ContextMenuStateProps;

export type ContextMenuStateProps<T = unknown> = {
   contextData?: T;
   isOpen?: boolean;
   position?: [number, number];
   parent?: HTMLElement | null;
};

export type ContextMenuItemProps = {
   label: string;
   disabled?: boolean;
   preventClose?: boolean;
   color?: "default" | "negative"
};

export type DropdownMenuProps = {
   label: string;
   nested?: boolean;
   children?: ReactNode;
};

export type DropdownMenuItemProps = {
   label: string;
   disabled?: boolean;
};

export type ContextMenuRelationship = { user: APIRelationUser; type: RelationshipType };
export type ContextMenuDMChannel = AppDirectChannel;
export type ContextMenuDMChannelRecipient = { channelId: Snowflake; recipient: APIChannelUser };
export type ContextMenuVoiceElement = { user: APIPublicUser; producerId?: string; consumerId?: string; kind: HMediaKind, channelId: Snowflake };

export type MessageRenderInfo = {
   message: AppMessage;
   newMinute: boolean;
   newDate: boolean;
   newAuthor: boolean;
   exoticType: boolean;
   unread: boolean;
};

export type MessageRendererProps = {
   renderInfo: MessageRenderInfo;
   nextRenderInfo?: MessageRenderInfo;
   lastRenderInfo?: MessageRenderInfo;
   onVisibilityChanged: (messageId: Snowflake, visible: boolean) => void;
   ref: RefObject<HTMLLIElement | null>;
};

export type MutationKinds = {
   "create-dm-channel_recipient": CreateDMChannelMutationVars;
   "create-dm-channel_other": CreateDMChannelMutationVars;
   "patch-dm-channel": PatchDMChannelMutationVars;
   "delete-dm-channel": Snowflake;
   "remove-channel-recipient": RemoveChannelRecipientMutationVars;
   "add-channel-recipient": AddChannelRecipientMutationVars;
   "create-relationship": CreateRelationshipMutationVars;
   "remove-relationship": Snowflake;
};

export type AppMessage =
   | { preview: true; id: Snowflake; timestamp: string; authorId: Snowflake; nonce?: number | string; content: string; channelId: Snowflake }
   | ({ preview: false } & Omit<APIMessage, "author"> & { authorId: Snowflake });

export type AppDirectChannel = Omit<DirectChannel, "recipients"> & { recipientIds: Snowflake[] };
export type AppRelationship = Omit<APIRelationshipWithoutOwner, "user"> & { userId: Snowflake };

export type AppAttachment = {
   id: number;
   data: ArrayBuffer;
   filename: string;
   contentType: string;
   description?: string;
};

export type HuginnToken = {
   type: string;
   markup: string;
   content: string;
   info: string;
   map: number[] | null;
   attrs: Array<[string, string]> | null;
};

export type AttachmentType = { id: number; dataUrl?: string; arrayBuffer: ArrayBuffer; filename: string; description?: string; contentType: string };

export type ProgressBarProps = {
   id?: string;
   orientation: "horizontal" | "vertical";
   percentage: number;
   bufferPercentage?: number;
   dragging: boolean;
   setPercentage: (percentage: number) => void;
   setBufferPercentage?: (bufferPercentage: number) => void;
   setDragging: (dragging: boolean) => void;
   onPercentageChange?: (percentage: number) => void;
   startOffset?: number;
   endOffset?: number;
   mouseOffset?: number;
   className?: string;
};

export type UploadProgress = { filenames: string[]; percentage: number; total: number; onAbort?: () => void };

export type DisplaySource = {
   thumbnail: string;
   appIcon?: string;
   name: string;
   id: string;
};

export type RemoteSource = {
   userId: Snowflake;
   consumerId?: string;
   producerId: string;
   kind: HMediaKind;
   srcObject?: MediaProvider;
   audioLevel?: AudioLevelChecker;
}

export type VoicePreference = { userId: Snowflake; microphoneVolume: number; screenshareVolume: number }
