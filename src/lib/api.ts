import { HuginnClient } from "@api";
import { settingsContent } from "./appData";

export let client: HuginnClient;

export function initializeClient() {
   client = new HuginnClient({
      rest: { api: `http://${settingsContent?.serverAddress ?? "192.168.178.51:3000"}` },
      gateway: {
         url: `ws://${settingsContent?.serverAddress ?? "192.168.178.51:3000"}/gateway`,
         createSocket(url) {
            return new WebSocket(url);
         },
      },
   });
}
