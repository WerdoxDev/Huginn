import type { Placement } from "@floating-ui/react";
import type { AddChannelRecipientMutationVars } from "@hooks/mutations/useAddChannelRecipient";
import type { CreateDMChannelMutationVars } from "@hooks/mutations/useCreateDMChannel";
import type { CreateRelationshipMutationVars } from "@hooks/mutations/useCreateRelationship";
import type { PatchDMChannelMutationVars } from "@hooks/mutations/usePatchDMChannel";
import type { RemoveChannelRecipientMutationVars } from "@hooks/mutations/useRemoveChannelRecipient";
import type {
   APICallMessage,
   APIDefaultMessage,
   APIGetKnownApplicationsResult,
   APIRelationshipWithoutOwner,
   APIReplyMessage,
   APIUserProfile,
   DeepPartial,
   DirectChannel,
   GatewayVoiceState,
   HMediaKind,
   PresenceUser,
   RelationshipType,
   Snowflake,
   UserPresence,
} from "@huginn/shared";
import type { screenShareFrameRates, screenShareQualities } from "@lib/constants";
import type { ChangeEvent, FocusEvent, HTMLInputTypeAttribute, ReactNode, RefCallback, RefObject } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";

export type StatusType = "none" | "default" | "error" | "success";

export type LoadingState = "none" | "loading" | "checking_update" | "checking_update_failed" | "updating" | "test";

export type InputMessage = {
   status: StatusType;
   text: string;
};

export type HuginnInputProps = {
   children?: ReactNode;
   headless?: boolean;
   className?: string;
   message: InputMessage;
   hideMessage?: boolean;
   required?: boolean;
   disabled?: boolean;
   value?: string;
   placeholder?: string;
   type?: HTMLInputTypeAttribute;
   ref?: RefCallback<HTMLInputElement | null>;
   name?: string;
   autoFocus?: boolean;
   onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
   onBlur?: (e: FocusEvent) => void;
   onFocus?: (e: FocusEvent) => void;
};

export type HuginnButtonProps = {
   children?: ReactNode;
   type?: "submit" | "reset" | "button" | undefined;
   className?: string;
   disabled?: boolean;
   color?: "primary" | "surface-deep" | "surface-alt" | "surface" | "positive" | "negative" | "caution" | "ghost";
   onClick?: () => void;
};

export type HuginnLoadingButtonProps = HuginnButtonProps & {
   isLoading: boolean;
   iconClassName?: string;
};

export type ModalState = {
   isOpen: boolean;
};

export type InfoModalState = {
   state: StatusType;
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
   onChange?: (value: Partial<AppSettings>) => void;
};

export type DropdownItem = {
   text: string;
   icon?: ReactNode;
   value: string;
};

export type ColorTheme = {
   surface: string;
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

   text: string;
};

export type ThemeType = "cerulean" | "pine green" | "eggplant" | "coffee" | "charcoal" | "scarlet";

export type TooltipOptions = {
   initialOpen?: boolean;
   hideOnMobile?: boolean;
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
   color?: "default" | "negative";
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

export type ContextMenuRelationship = { user: AppUser; type: RelationshipType };
export type ContextMenuDMChannel = AppDirectChannel;
export type ContextMenuDMChannelRecipient = { channelId: Snowflake; recipient: AppUser };
export type ContextMenuVoiceElement = {
   user: AppUser;
   guildId: Snowflake | null;
   channelId: Snowflake;
   mediaSource: MediaSource;
   secondMediaSource?: MediaSource;
};
export type ContextMenuMessage = {
   message: AppMessage;
   url?: string;
   imgRef?: RefObject<HTMLImageElement | null>;
};

export type ProcessedMessage = AppMessage & {
   hasNewMinute: boolean;
   hasNewDate: boolean;
   hasNewAuthor: boolean;
   isActionType: boolean;
   isReplyType: boolean;
   isUnread: boolean;
   isEditing: boolean;
   isReplying: boolean;
   isJumpHighlighted: boolean;
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
   "patch-user": unknown;
};

export type AppUser<U = PresenceUser> = U & {
   displayName: string | null;
   originalDisplayName?: string | null;
};

export type AppPresence = Omit<UserPresence, "user"> & { userId: Snowflake };
export type AppUserProfile = Omit<APIUserProfile, "user"> & { userId: Snowflake };

export enum MessageErrorType {
   FAILED_TO_SEND = 0,
}

export type PreviewAppMessage = {
   isPreview: true;
   id: Snowflake;
   timestamp: string;
   authorId: Snowflake;
   nonce?: string;
   content: string;
   channelId: Snowflake;
   referencedMessage?: AppMessage | null;
   error?: MessageErrorType;
   abortController?: AbortController;
};

export type ProcessedAppMessage = {
   isPreview: false;
   authorId: Snowflake;
   mentions: Snowflake[];
   source: "websocket" | "fetch";
} & (
   | Omit<APICallMessage, "author" | "mentions">
   | Omit<APIDefaultMessage, "author" | "mentions">
   | (Omit<APIReplyMessage, "author" | "mentions" | "referencedMessage"> & {
        referencedMessage?: AppMessage | null;
     })
);

export type AppMessage = PreviewAppMessage | ProcessedAppMessage;

export type AppDirectChannel = Omit<DirectChannel, "recipients"> & {
   recipientIds: Snowflake[];
   name: string;
   originalName?: string | null;
};
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

export type AttachmentType = {
   id: number;
   dataUrl?: string;
   arrayBuffer: ArrayBuffer;
   filename: string;
   description?: string;
   contentType: string;
};

export type SliderProps = {
   currentPercent: number;
   bufferedPercent?: number;
   onHoverChanged?: (isHovering: boolean) => void;
   onDragChanged?: (isDragging: boolean) => void;
   onChange: (percent: number) => void;
   orientation?: "horizontal" | "vertical";
};

export type UploadProgress = {
   messageId: Snowflake;
   filenames?: string[];
   percentage: number;
   total: number;
   onAbort?: () => void;
};

export type DisplaySource = {
   thumbnail: string;
   appIcon?: string;
   name: string;
   id: string;
};

export type AudioSource = {
   appIcon?: string;
   name: string;
   processId: string;
};

export type VoicePreference = { userId: Snowflake; microphoneVolume: number; streamVolume: number };

export type HostnamePreset = {
   name: string;
   hostnameSource: "manual" | "external";
   apiHostname: string;
   cdnHostname: string;
   voiceHostname: string;
   analyticsHostname: string;
   externalHostnamesUrl: string;
};

export type AppSettings = {
   hostnamePresets: HostnamePreset[];
   activePresetName: string | null;
   theme: ThemeType;
   inputDeviceId: string;
   outputDeviceId: string;
   cameraDeviceId: string;
   inputVolume: number;
   outputVolume: number;
   inputThreshold: number;
   noiseSuppression: boolean;
   screenShareFramerate: string;
   screenShareQuality: string;
   screenShareAudio: boolean;
   screenShareSimulcast: boolean;
   screenShareVideoBitrate: number;
   screenShareAudioBitrate: number;
};

export type Keybind = { type: KeybindType; combination: string[]; isEnabled: boolean };

export type KeybindType = "toggle_mute" | "toggle_deafen";

export type CustomApplication = {
   title: string;
   exePath: string;
   isEnabled: boolean;
   lastOpened?: number;
};

export type ClientInfo = {
   id: string;
};

export type StorageMap = {
   settings: AppSettings;
   "voice-preferences": VoicePreference[];
   keybinds: Keybind[];
   "known-applications": APIGetKnownApplicationsResult;
   "custom-applications": CustomApplication[];
   "client-info": ClientInfo;
};
export type FileType = keyof StorageMap;

export type LoadFileResult<K extends FileType> = {
   success: boolean;
   data: StorageMap[K];
   created: boolean;
   error?: string;
};

export type SaveFileResult = {
   success: boolean;
   error?: string;
};

export type MediaSource = {
   consumerId?: string;
   producerId?: string;
   consumerUserIds: string[];
   track?: MediaStreamTrack | null;
   trackSettings?: MediaTrackSettings;
   maxBitrate?: number;
   kind: HMediaKind;
   userId: Snowflake;
   type: "consuming" | "consumable" | "producing";
};

export type ALCData = {
   producerId?: string;
   consumerId?: string;
   currentDb: number;
   userId?: Snowflake;
   kind?: HMediaKind;
   isStopped: boolean;
   context?: AudioContextData;
   stream?: StreamData;
};

export type ASPData = {
   context?: AudioContextData;
   stream?: StreamData;
   gain: number;
   globalGain: number;
   localGain: number;
   producerId: string;
   userId: Snowflake;
   kind: HMediaKind;
};

export type AudioContextData = {
   baseLatency: number;
   outputLatency: number;
   state: AudioContextState;
   sinkId: string;
};

export type StreamData = {
   id: string;
   audioTracks: Array<TrackData>;
   videoTracks: Array<TrackData>;
};

export type TrackData = {
   id: string;
   kind: string;
   readyState: MediaStreamTrackState;
   enabled: boolean;
   label: string;
   muted: boolean;
   settings: MediaTrackSettings;
};

export type CandidateData = {
   address?: string;
   port?: number;
   protocol?: "tcp" | "udp";
};

export type ConsumerStats = {
   connection?: {
      rtt?: number;
      availableOutgoingBitrate?: number;
      availableIncomingBitrate?: number;
      localCandidate?: CandidateData;
      remoteCandidate?: CandidateData;
   };
   transport?: {
      bytesReceived?: number;
      bytesSent?: number;
      packetsReceived?: number;
      packetsSent?: number;
      iceState?: string;
      dtlsState: string;
   };
   codec?: {
      channels?: number;
      clockRate?: number;
      mimeType: string;
   };
   audioInbound?: {
      bitrate: number;
      jitter?: number;
      audioLevel?: number;
      packetsLost?: number;
      concealedSamples?: number;
      silentConcealedSamples?: number;
   };
   videoInbound?: {
      bitrate: number;
      width?: number;
      height?: number;
      fps?: number;
      jitter?: number;
      packetsLost?: number;
      framesDropped?: number;
   };
};

export type ProducerStats = {
   connection?: {
      rtt?: number;
      availableOutgoingBitrate?: number;
      availableIncomingBitrate?: number;
      localCandidate?: CandidateData;
      remoteCandidate?: CandidateData;
   };
   transport?: {
      bytesReceived?: number;
      bytesSent?: number;
      packetsReceived?: number;
      packetsSent?: number;
      iceState?: string;
      dtlsState: string;
   };
   codec?: {
      channels?: number;
      clockRate?: number;
      mimeType: string;
   };
   audioOutbound?: Array<{
      active?: boolean;
      bitrate: number;
      audioLevel?: number;
      packetsSent?: number;
      totalAudioEnergy?: number;
      targetBitrate?: number;
      rid?: string;
      ssrc: number;
   }>;
   videoOutbound?: Array<{
      active?: boolean;
      bitrate: number;
      width?: number;
      height?: number;
      fps?: number;
      packetsSent?: number;
      scalabilityMode?: string;
      targetBitrate?: number;
      rid?: string;
      ssrc: number;
   }>;
};

export type ConsumerDebugData = {
   type: "local" | "remote";
   id: string;
   producerId: string;
   userId: Snowflake;
   track?: TrackData;
   kind?: string;
   mediaKind: HMediaKind;
   stats?: ConsumerStats;
};

export type ProducerDebugData = {
   type: "local" | "remote";
   id: string;
   userId: Snowflake;
   track?: TrackData;
   kind?: string;
   mediaKind: HMediaKind;
   stats?: ProducerStats;
};

export type StatsParserData = { id: string; type: "consumer" | "producer" };

export type VoiceStatesDebugData = {
   speaking?: boolean;
} & GatewayVoiceState;

export type UsersDebugData = AppUser;

export type VoiceDebugData = {
   alcData: Array<ALCData>;
   aspData: Array<ASPData>;
   consumersData: Array<ConsumerDebugData>;
   producersData: Array<ProducerDebugData>;
   statsParsersData: Array<StatsParserData>;
   voiceStatesData: Array<VoiceStatesDebugData>;
   usersData: Array<UsersDebugData>;
};

export type Environment = "desktop" | "browser";

export type ScreenShareQuality = (typeof screenShareQualities)[number]["value"];
export type ScreenShareFrameRate = (typeof screenShareFrameRates)[number];

export type UseHuginnFormSetCustomMessage<TFieldValues extends FieldValues> = <TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
   name: TFieldName,
   message: InputMessage | null,
) => void;
