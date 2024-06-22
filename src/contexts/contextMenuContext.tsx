import { APIDMChannel, APIGroupDMChannel } from "@shared/api-types";
import { Dispatch, MouseEvent, ReactNode, createContext, useContext, useReducer } from "react";

type ContextMenuContextType = {
   dmChannel?: {
      data?: APIDMChannel | APIGroupDMChannel;
      isOpen: boolean;
      position?: [number, number];
   };
};

const defaultValue: ContextMenuContextType = { dmChannel: { isOpen: false } };

const ContextMenuContext = createContext<ContextMenuContextType>(defaultValue);
const ContextMenuDispatchContext = createContext<Dispatch<ContextMenuContextType>>(() => {});

export function ContextMenuProvider(props: { children?: ReactNode }) {
   const [contextMenus, dispatch] = useReducer(contextMenusReducer, defaultValue);
   return (
      <ContextMenuContext.Provider value={contextMenus}>
         <ContextMenuDispatchContext.Provider value={dispatch}>{props.children}</ContextMenuDispatchContext.Provider>
      </ContextMenuContext.Provider>
   );
}

function contextMenusReducer(contextMenus: ContextMenuContextType, action: ContextMenuContextType): ContextMenuContextType {
   return { ...contextMenus, ...action };
}

export function useChannelContextMenu() {
   const dispatch = useContext(ContextMenuDispatchContext);

   function open(channel: APIDMChannel | APIGroupDMChannel, e: MouseEvent) {
      e.preventDefault();
      dispatch({ dmChannel: { isOpen: true, data: channel, position: [e.clientX, e.clientY] } });
   }

   return open;
}

//const onContextMenu = useContextMenu("channels");

//

export function useContextMenu() {
   return useContext(ContextMenuContext);
}

export function useContextMenuDispatch() {
   return useContext(ContextMenuDispatchContext);
}
