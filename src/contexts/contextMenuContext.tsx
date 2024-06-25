import { ContextMenuStateProps } from "@/types";
import { APIDMChannel, APIGroupDMChannel, APIRelationUser, APIRelationshipWithoutOwner, RelationshipType } from "@shared/api-types";
import { Dispatch, MouseEvent, ReactNode, createContext, useContext, useReducer } from "react";

type ContextMenuContextType = {
   dmChannel?: {
      data?: APIDMChannel | APIGroupDMChannel;
   } & ContextMenuStateProps;
   relationshipMore?: {
      data?: { user: APIRelationUser; type: RelationshipType };
   } & ContextMenuStateProps;
};

const ContextMenuContext = createContext<ContextMenuContextType>({});
const ContextMenuDispatchContext = createContext<Dispatch<ContextMenuContextType>>(() => {});

export function ContextMenuProvider(props: { children?: ReactNode }) {
   const [contextMenus, dispatch] = useReducer(contextMenusReducer, {});
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

export function useRelationshipMoreContextMenu() {
   const dispatch = useContext(ContextMenuDispatchContext);

   function open(user: APIRelationUser, type: RelationshipType, e: MouseEvent) {
      e.preventDefault();
      dispatch({ relationshipMore: { isOpen: true, data: { user, type }, position: [e.clientX, e.clientY] } });
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
