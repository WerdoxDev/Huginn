import type { SettingsContextType } from "@contexts/settingsContext";
import type { Placement } from "@floating-ui/react";
import type { AddChannelRecipientMutationVars } from "@hooks/mutations/useAddChannelRecipient";
import type { CreateDMChannelMutationVars } from "@hooks/mutations/useCreateDMChannel";
import type { CreateRelationshipMutationVars } from "@hooks/mutations/useCreateRelationship";
import type { PatchDMChannelMutationVars } from "@hooks/mutations/usePatchDMChannel";
import type { RemoveChannelRecipientMutationVars } from "@hooks/mutations/useRemoveChannelRecipient";
import type { APIChannelUser, APIDefaultMessage, APIMessageUser, APIRelationUser, DirectChannel, RelationshipType, Snowflake } from "@huginn/shared";
import type { ChangeEvent, HTMLInputTypeAttribute, ReactNode, RefObject } from "react";

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
	component?: (props: SettingsTabProps) => React.JSX.Element;
};

export type SettingsTabProps = {
	settings: DeepPartial<SettingsContextType>;
	onChange?: (value: DeepPartial<SettingsContextType>) => void;
	onSave?: () => Promise<void>;
};

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type DropboxItem = {
	text: string;
	icon?: ReactNode;
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
	warning: string;
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
	renderChildren: ReactNode;
	close?: () => void;
} & ContextMenuStateProps;

export type ContextMenuStateProps<T = unknown> = {
	contextData?: T;
	isOpen?: boolean;
	position?: [number, number];
};

export type ContextMenuItemProps = {
	label: string;
	disabled?: boolean;
};

export type ContextMenuRelationship = { user: APIRelationUser; type: RelationshipType };
export type ContextMenuDMChannel = DirectChannel;
export type ContextMenuDMChannelRecipient = { channelId: Snowflake; recipient: APIChannelUser };

export type MessageRenderInfo = {
	message: AppChannelMessage;
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

export type AppChannelMessage =
	| { preview: true; id: Snowflake; timestamp: string; author: APIMessageUser; nonce?: number | string; content: string; channelId: Snowflake }
	| ({ preview: false } & APIDefaultMessage);
