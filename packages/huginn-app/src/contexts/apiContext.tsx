import { HuginnClient } from "@huginn/api/index";
import { ReactNode, createContext, useContext, useState } from "react";
import { useSettings } from "./settingsContext";

type APIContextType = HuginnClient;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const APIContext = createContext<APIContextType>(undefined!);

export function APIProvider(props: { children?: ReactNode }) {
   const settings = useSettings();

   const [client] = useState<APIContextType>(
      new HuginnClient({
         rest: { api: `http://${settings.serverAddress}` },
         gateway: {
            url: `ws://${settings.serverAddress}/gateway`,
            createSocket(url) {
               return new WebSocket(url);
            },
         },
      }),
   );

   return <APIContext.Provider value={client}>{props.children}</APIContext.Provider>;
}

export function useClient() {
   return useContext(APIContext);
}
