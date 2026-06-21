import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface KeyboardInsetPlugin {
   //   getLastHeight(): Promise<{ keyboardHeight: number }>;
   addListener(event: "keyboardInsetChange", handler: (data: { height: number; isShowing: boolean }) => void): Promise<PluginListenerHandle>;
   hide(): Promise<void>;
   show(): Promise<void>;
}

const KeyboardInset = registerPlugin<KeyboardInsetPlugin>("KeyboardInset");

export default KeyboardInset;
