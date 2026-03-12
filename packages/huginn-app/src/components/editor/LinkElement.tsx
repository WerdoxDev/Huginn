import { MessageContext } from "@contexts/MessageProvider";
import { useOpen } from "@hooks/useOpen";
import { useContextMenu } from "@stores/contextMenuStore";
import { useContext, type ReactNode } from "react";

export default function LinkElement(props: { children?: ReactNode; url?: string }) {
   const { openUrl } = useOpen();
   const { open } = useContextMenu("message");
   const context = useContext(MessageContext);

   return (
      <span
         onContextMenu={(e) => open({ message: context.message, url: props.url }, e)}
         className="relative inline-block cursor-pointer underline"
         onClick={() => (props.url ? openUrl(props.url) : undefined)}
         title={props.url}
      >
         <div>
            {props.children}
            <div className="hover:bg-text/20 absolute inset-0 -mx-0.5 rounded-xs" />
         </div>
      </span>
   );
}
