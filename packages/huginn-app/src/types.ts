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
   APIReferenceMessage,
   APIUserProfile,
   APIDMChannel,
   APIGroupDMChannel,
   GatewayVoiceState,
   HMediaKind,
   PresenceUser,
   RelationshipType,
   Snowflake,
   UserPresence,
   MessageFlags,
   ThemeType,
   ChannelType,
} from "@huginn/shared";
import type { AUDIO_QUALITIES, SCREEN_SHARE_FRAME_RATES, SCREEN_SHARE_QUALITIES } from "@lib/constants";
import type { ProcessInfo } from "native-addon";
import type { ChangeEvent, FocusEvent, HTMLInputTypeAttribute, MouseEvent, ReactNode, RefCallback, RefObject } from "react";
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
   onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
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

export type SettingsTabType = {
   name: string;
   text: string;
   auth?: boolean;
   children?: Omit<SettingsTabType, "children">[];
   icon?: ReactNode;
   component?: (props: SettingsTabProps) => React.JSX.Element | undefined;
};

export type SettingsTabProps = {
   onChange?: (value: Partial<AppSettings>) => void;
};

export type SelectItem<T = string> = {
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

export type ContextMenuProps<T> = {
   // label?: string;
   renderChildren?: ReactNode;
   contextMenu?: ContextMenuStateProps<T>;
   onClose?: () => void;
};

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

export type PopoverStateProps<T = unknown> = {
   isOpen?: boolean;
   position?: [number, number];
   data?: T;
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
   isMentioned: boolean;
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
   attachments?: AppAttachment[];
   flags?: MessageFlags;
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
   | (Omit<APIReferenceMessage, "author" | "mentions" | "referencedMessage"> & {
        referencedMessage?: AppMessage | null;
     })
);

export type AppMessage = PreviewAppMessage | ProcessedAppMessage;

type AppChannelBuilder<T> = Omit<T, "recipients"> & {
   recipientIds: Snowflake[];
   name: string;
   originalName?: string | null;
};

export type AppDirectChannel = AppChannelBuilder<APIDMChannel> | AppChannelBuilder<APIGroupDMChannel>;
export type AppRelationship = Omit<APIRelationshipWithoutOwner, "user"> & { userId: Snowflake };

export type AppAttachment = {
   key: string;
   data: (() => Promise<ArrayBuffer>) | ArrayBuffer;
   previewDataUrl?: string;
   filename: string;
   contentType: string;
   description?: string;
};

// export type AppAttachment = {
//    id: number;
//    dataUrl?: string;
//    arrayBuffer: ArrayBuffer;
//    filename: string;
//    description?: string;
//    contentType: string;
// };

export type AttachmentInput = { key?: string; name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer>; previewDataUrl?: string };

export type SliderProps = {
   currentPercent: number;
   bufferedPercent?: number;
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
   thumbnail: string | null;
   appIcon?: string | null;
   name: string;
   electronId: string;
};

export type AudioSource = {
   appIcon?: string;
   name: string;
   processId: number;
};

export type HostnamePreset = {
   name: string;
   hostnameSource: "manual" | "external";
   apiHostname: string;
   cdnHostname: string;
   voiceHostname: string;
   posthogHostname: string;
   otelHostname: string;
   externalHostnamesUrl: string;
};

export type AppSettings = {
   hostnamePresets: HostnamePreset[];
   activePresetName: string;
   theme: ThemeType;
   isChannelSidebarOpen: boolean;
   inputDeviceId: string;
   outputDeviceId: string;
   cameraDeviceId: string;
   inputVolume: number;
   outputVolume: number;
   inputThreshold: number;
   noiseSuppression: boolean;
   screenShareFramerate: string;
   screenShareQuality: string;
   audioStreamQuality: string;
   screenShareAudio: boolean;
   screenShareSimulcast: boolean;
   screenShareVideoBitrate: number;
   screenShareAudioBitrate: number;
   useProxy: boolean;
   isVoiceMuted: boolean;
   isVoiceDeafened: boolean;
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
   lastVersion?: string;
};

export type StorageMap = {
   settings: AppSettings;
   keybinds: Keybind[];
   "known-applications": APIGetKnownApplicationsResult;
   "custom-applications": CustomApplication[];
   "client-info": ClientInfo;
   "pinned-channels": Snowflake[];
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

export type Environment = "desktop" | "browser" | "android";

export type ScreenShareQuality = (typeof SCREEN_SHARE_QUALITIES)[number]["value"];
export type ScreenShareFrameRate = (typeof SCREEN_SHARE_FRAME_RATES)[number];
export type AudioQuality = (typeof AUDIO_QUALITIES)[number]["value"];

export type UseHuginnFormSetCustomMessage<TFieldValues extends FieldValues> = <TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
   name: TFieldName,
   message: InputMessage | null,
) => void;

export type AnimatedMode = "hover" | "always" | "never";

export type UpdateInfo = {
   version: string;
};

type AutocompleteUserItem = {
   type: "user";
   id: Snowflake;
   username: string;
   displayName?: string | null;
   avatarHash?: string | null;
};

export type AutocompleteSpecialItem = {
   type: "special";
   ids: string[];
   channelType: ChannelType;
   label: string;
   description: string;
};

export type AutocompleteItem = AutocompleteUserItem | AutocompleteSpecialItem;
export type AutocompleteType = AutocompleteItem["type"];
export type AutocompleteState = {
   isOpen: boolean;
   type: AutocompleteType | null;
   query: string;
   selectedIndex: number;
};

export type ApplicationInfo = ProcessInfo & { icon: string | null; displayName: string | null };

export type OsInfo = {
   platform: string;
   arch: string;
   version: string;
   chromeVersion: string;
   electronVersion: string;
};
