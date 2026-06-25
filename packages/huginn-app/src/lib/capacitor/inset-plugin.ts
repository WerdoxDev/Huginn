import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface InsetPlugin {
   addListener(
      event: "insetChange",
      handler: (data: { keyboardHeight: number; navBarHeight: number; isShowing: boolean }) => void,
   ): Promise<PluginListenerHandle>;
   hide(): Promise<void>;
   show(): Promise<void>;
}

const Inset = registerPlugin<InsetPlugin>("Inset");

export default Inset;
