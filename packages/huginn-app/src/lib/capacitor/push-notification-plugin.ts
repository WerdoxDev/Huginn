/// <reference types="@capacitor/cli" />

import { registerPlugin, type PermissionState, type PluginListenerHandle } from "@capacitor/core";

export type PresentationOption = "badge" | "sound" | "alert" | "banner" | "list";

declare module "@capacitor/cli" {
   export interface PluginsConfig {
      PushNotifications?: {
         /**
          * This is an array of strings you can combine. Possible values in the array are:
          *   - `badge`: badge count on the app icon is updated (default value)
          *   - `sound`: the device will ring/vibrate when the push notification is received
          *   - `alert`: **Deprecated on iOS.** Use `banner` and `list` instead. On Android, this value is still used to display the notification.
          *   - `banner`: the push notification is displayed as a banner. On Android, defaults to the same behavior as `alert`.
          *   - `list`: the push notification is displayed in the notification center. On Android, defaults to the same behavior as `alert`.
          *
          * An empty array can be provided if none of the options are desired.
          *
          * badge is only available for iOS.
          *
          * @since 1.0.0
          * @example ["badge", "sound", "alert", "banner", "list"]
          */
         presentationOptions: PresentationOption[];
      };
   }
}

export interface PushNotificationsPlugin {
   register(): Promise<void>;
   unregister(): Promise<void>;
   getDeliveredNotifications(): Promise<DeliveredNotifications>;
   removeDeliveredNotifications(delivered: DeliveredNotifications): Promise<void>;
   removeAllDeliveredNotifications(): Promise<void>;
   createChannel(channel: Channel): Promise<void>;
   deleteChannel(args: { id: string }): Promise<void>;
   listChannels(): Promise<ListChannelsResult>;
   checkPermissions(): Promise<PermissionStatus>;
   requestPermissions(): Promise<PermissionStatus>;

   setActiveChannel(options: { channelId: string | null }): Promise<void>;

   addListener(eventName: "registration", listenerFunc: (token: Token) => void): Promise<PluginListenerHandle>;

   addListener(eventName: "registrationError", listenerFunc: (error: RegistrationError) => void): Promise<PluginListenerHandle>;

   addListener(eventName: "pushNotificationReceived", listenerFunc: (notification: PushNotificationSchema) => void): Promise<PluginListenerHandle>;

   addListener(eventName: "pushNotificationActionPerformed", listenerFunc: (notification: ActionPerformed) => void): Promise<PluginListenerHandle>;

   removeAllListeners(): Promise<void>;
}

export interface PushNotificationSchema {
   title?: string;
   subtitle?: string;
   body?: string;
   id: string;
   tag?: string;
   badge?: number;
   data: any;
   click_action?: string;
   link?: string;
   group?: string;
   groupSummary?: boolean;
}

export interface ActionPerformed {
   actionId: string;
   inputValue?: string;
   notification: PushNotificationSchema;
}

export interface Token {
   value: string;
}

export interface RegistrationError {
   error: string;
}

export interface DeliveredNotifications {
   notifications: PushNotificationSchema[];
}

export interface Channel {
   id: string;
   name: string;

   description?: string;
   sound?: string;
   importance?: Importance;
   visibility?: Visibility;
   lights?: boolean;
   lightColor?: string;
   vibration?: boolean;
}
export type Importance = 0 | 1 | 2 | 3 | 4 | 5;
export type Visibility = -1 | 0 | 1;

export interface ListChannelsResult {
   channels: Channel[];
}

export interface PermissionStatus {
   receive: PermissionState;
}

const PushNotifications = registerPlugin<PushNotificationsPlugin>("PushNotifications", {});
export { PushNotifications };
